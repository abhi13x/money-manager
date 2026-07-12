import React from 'react';

export const DateSelector: React.FC = () => {
      return (<div className="flex justify-between items-center p-4 text-slate-600 dark:text-slate-400 font-medium">
        <button className="p-1">&lt;</button>
        <span className="text-sm">Jul 2020</span>
        <button className="p-1">&gt;</button>
      </div>);
}