import Error from "./assets/error.svg";

export default function error() {
  return (
    <div className="w-full h-full mt-[36px] flex flex-col items-center justify-center">
      <div className="w-[457px] h-[464px] pl-[20px] pr-[20px] border border-[#d9dee2] rounded-[10px] flex flex-col items-center justify-center">
        <img className="" src={Error} alt="Ошибка" />
        <h1 className="mt-[20px] text-title">Произошла ошибка</h1>
      </div>
    </div>
  );
}
