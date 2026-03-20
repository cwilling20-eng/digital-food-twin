interface MacroData {
  protein: number;
  carbs: number;
  fat: number;
  proteinUnit?: string;
  carbsUnit?: string;
  fatUnit?: string;
}

interface MacroPillsProps {
  data: MacroData;
  className?: string;
}

export function MacroPills({ data, className = '' }: MacroPillsProps) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {/* Protein — coral background, white text */}
      <div className="bg-nm-signature text-white p-5 rounded-nm flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold">{data.protein}{data.proteinUnit || 'g'}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
          Protein
        </span>
      </div>

      {/* Carbs — mango background, dark text */}
      <div className="bg-nm-accent text-nm-text p-5 rounded-nm flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold">{data.carbs}{data.carbsUnit || 'g'}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
          Carbs
        </span>
      </div>

      {/* Fat — surface background, dark text */}
      <div className="bg-nm-surface text-nm-text p-5 rounded-nm flex flex-col items-center justify-center shadow-sm">
        <span className="text-2xl font-extrabold">{data.fat}{data.fatUnit || 'g'}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">
          Fat
        </span>
      </div>
    </div>
  );
}
