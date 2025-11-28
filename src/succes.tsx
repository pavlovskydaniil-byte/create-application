import Done from "./assets/done.svg";

export default function succes() {
  return (
    <div className="w-full h-full mt-[36px] flex flex-col items-center justify-center">
      <div className="w-[457px] h-[464px] pl-[20px] pr-[20px] border border-[#d9dee2] rounded-[10px] flex flex-col items-center justify-center">
        <img className="" src={Done} alt="Успех" />
        <h1 className="mt-[20px] text-title">Оплата прошла успешно</h1>
      </div>
    </div>
  );
}
