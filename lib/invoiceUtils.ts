export function getInvoiceDateRange(closingDay: number, month: number, year: number) {
  // O mês no objeto Date do JS é 0-indexed (0 = Jan, 1 = Fev, etc)
  
  // Calcular o último dia válido para o mês atual
  const lastDayOfCurrentMonth = new Date(year, month, 0).getDate()
  const actualClosingDay = Math.min(closingDay, lastDayOfCurrentMonth)
  
  const endDateObj = new Date(year, month - 1, actualClosingDay)
  
  // Calcular o último dia válido para o mês anterior
  const lastDayOfPrevMonth = new Date(year, month - 1, 0).getDate()
  const prevMonthClosingDay = Math.min(closingDay, lastDayOfPrevMonth)
  
  // Start date é 1 dia após o fechamento do mês anterior
  const startDateObj = new Date(year, month - 2, prevMonthClosingDay + 1)
  
  return {
    startDate: startDateObj.toISOString().split('T')[0],
    endDate: endDateObj.toISOString().split('T')[0],
  }
}
