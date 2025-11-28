import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router";
import { useState } from "react";
import cat from "../src/assets/cat.jpg";

const schema = z.object({
  cardNumber: z
    .string()
    .min(13, "Номер карты должен содержать от 13 до 19 цифр")
    .max(19, "Номер карты должен содержать от 13 до 19 цифр")
    .regex(/^\d+$/, "Номер карты должен содержать только цифры"),
  cvv: z.string().regex(/^\d{3}$/, "CVV должен содержать ровно 3 цифры"),
  expiration: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Введите дату в формате MM/YY")
    .refine(
      (value) => {
        const [month, year] = value.split("/").map(Number);
        return month >= 1 && month <= 12 && year >= 21 && year <= 26;
      },
      { message: "Неверный срок действия карты" }
    ),
  fullName: z
    .string()
    .min(2, "Введите имя и фамилию")
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ\s]+$/,
      "Имя может содержать только буквы и пробелы"
    )
    .refine(
      (value) =>
        value
          .trim()
          .split(/\s+/)
          .filter((part) => part.length > 0).length === 2,
      "Требуется ровно два слова (имя и фамилия)"
    ),
});

type FormData = z.infer<typeof schema>;

export default function CardForm() {
  const navigate = useNavigate();
  const [expirationInput, setExpirationInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const formatCardNumber = (value: string): string => {
    return value
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(\d{4})/g, "$1 ")
      .trim();
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const unformatted = input.replace(/\D/g, "");
    const formatted = formatCardNumber(unformatted);

    setCardNumberInput(formatted);
    setValue("cardNumber", unformatted, {
      shouldValidate: true,
    });
  };

  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    setExpirationInput(value);
    setValue("expiration", value, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    const nameParts = data.fullName
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0);

    const [firstname, lastname] = nameParts;
    const id = uuidv4();

    try {
      const res = await axios.post("http://localhost:2050/api", {
        jsonrpc: "2.0",
        id,
        method: "pay",
        params: {
          pan: data.cardNumber,
          expire: data.expiration,
          cardholder: `${firstname} ${lastname}`,
          cvc: data.cvv,
        },
      });

      const pid = res.data?.result?.pid;
      pid ? navigate(`/${pid}`) : alert("Ошибка оплаты: PID не получен");
    } catch (error) {
      console.error("Ошибка отправки:", error);
      alert("Произошла ошибка при оплате");
    }
  };

  return (
    <div className="w-full h-full mt-[36px] flex flex-col items-center justify-center">
      <div className="w-[457px] h-[464px] pl-[20px] pr-[20px] border border-[#d9dee2] rounded-[10px] shadow-md">
        <h1 className="w-[368px] h-[32px] text-title mt-[32px] mb-[20px]">
          Оплата банковской картой
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="w-[417px] h-[84px]">
            <label className="block text-button mb-[4px] text-gray-800">
              Номер карты
            </label>
            <input
              type="text"
              value={cardNumberInput}
              onChange={handleCardNumberChange}
              className={`w-full h-[40px] rounded-[10px] pl-[14px] border ${
                errors.cardNumber ? "border-error" : "border-[#d9dee2]"
              } focus:outline-none hover:border-grey-800`}
              placeholder="0000 0000 0000 0000"
            />
            {errors.cardNumber && (
              <p className="text-error text-xs mt-1">
                {errors.cardNumber.message}
              </p>
            )}
          </div>

          <div className="mt-[20px] flex justify-between">
            <div className="w-[170px] h-[84px]">
              <label className="block text-button mb-[4px] text-gray-800">
                Месяц/Год
              </label>
              <input
                type="text"
                value={expirationInput}
                onChange={handleExpirationChange}
                className={`w-full h-[40px] rounded-[10px] pl-[14px] border ${
                  errors.expiration ? "border-error" : "border-[#d9dee2]"
                } focus:outline-none  hover:border-grey-800`}
                placeholder="MM/YY"
              />
              {errors.expiration && (
                <p className="text-error text-xs mt-1">
                  {errors.expiration.message}
                </p>
              )}
            </div>

            <div className="w-[170px] h-[84px]">
              <label className="block text-button mb-[4px] text-gray-800">
                Код
              </label>
              <input
                type="password"
                {...register("cvv")}
                className={`w-full h-[40px] rounded-[10px] pl-[14px] border ${
                  errors.cvv ? "border-error" : "border-[#d9dee2]"
                } focus:outline-none  hover:border-grey-800`}
                placeholder="***"
                maxLength={3}
              />
              {errors.cvv && (
                <p className="text-error text-xs mt-1">{errors.cvv.message}</p>
              )}
            </div>
          </div>

          <div className="mt-[20px] w-[417px] h-[84px]">
            <label className="mt-[20px] text-button mb-[4px] text-gray-800">
              Владелец карты
            </label>
            <input
              type="text"
              {...register("fullName")}
              className={`w-full h-[40px] rounded-[10px] pl-[14px] border ${
                errors.fullName ? "border-error" : "border-[#d9dee2]"
              } focus:outline-none  hover:border-grey-800`}
              placeholder="IVAN IVANOV"
            />
            {errors.fullName && (
              <p className="text-error text-xs mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div className="flex justify-end mt-[20px]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-[123px] h-[48px] bg-blue-600 text-white py-2 rounded-[10px] hover:bg-hover transition disabled:opacity-50"
            >
              {isSubmitting ? "Отправка..." : "Оплатить"}
            </button>
          </div>
          <img src={cat} className="mt-[100px]" alt="cat" />
        </form>
      </div>
    </div>
  );
}
