export function addMonths(period:string, offset:number):string {
  const date=new Date(`${period}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth()+offset);
  return date.toISOString().slice(0,7);
}
