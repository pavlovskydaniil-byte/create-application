import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import Error from "./error";
import Succes from "./succes";
import Payment from "./payment";
import axios from "axios";

type PaymentStatus = "processing" | "ok" | "fail";

interface PaymentResponse {
  status: PaymentStatus;
  pid: string;
}

const PaymentStatusChecker: React.FC<{ pid: string }> = ({ pid }) => {
  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkPayment = async () => {
      try {
        const response = await axios.get<PaymentResponse>(
          `http://localhost:2050/pay/check/${pid}`
        );
        const paymentStatus = response.data.status;

        if (paymentStatus === "ok" || paymentStatus === "fail") {
          setStatus(paymentStatus);
        } else {
          timeoutId = setTimeout(checkPayment, 1000);
        }
      } catch (err) {
        setError("Ошибка при проверке платежа");
        console.error(err);
      }
    };

    checkPayment();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pid]);

  if (error) return <div>{error}</div>;

  return (
    <div>
      {status === "processing" && <Payment />}
      {status === "ok" && <Succes />}
      {status === "fail" && <Error />}
    </div>
  );
};

export const Page: React.FC = () => {
  const { pid } = useParams<{ pid: string }>();

  if (!pid) return <div>Неверный параметр платежа</div>;

  return <PaymentStatusChecker pid={pid} />;
};

export default Page;
