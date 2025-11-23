export interface CBRData {
  keyRate: number;
  inflation: number;
  date: string;
}

export const getCBRData = (): CBRData => {
  const savedData = localStorage.getItem('cbr_data');
  if (savedData) {
    return JSON.parse(savedData);
  }
  
  // Default values if nothing saved
  return {
    keyRate: 21.0,
    inflation: 9.0,
    date: new Date().toISOString().split('T')[0]
  };
};

export const saveCBRData = (data: CBRData) => {
  localStorage.setItem('cbr_data', JSON.stringify(data));
};