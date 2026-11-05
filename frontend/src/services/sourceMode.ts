export const isRealData = (import.meta as ImportMeta & {env:Record<string,string>}).env?.VITE_DATA_SOURCE === 'real';
