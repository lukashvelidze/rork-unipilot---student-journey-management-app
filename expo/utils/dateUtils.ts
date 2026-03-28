export const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true
  };
  return date.toLocaleTimeString('en-US', options);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric', 
    minute: 'numeric',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();
};

export const isYesterday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

export const isThisWeek = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  
  return date >= firstDayOfWeek && date <= lastDayOfWeek;
};

export const isThisMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

export const getDaysUntil = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - date.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isDateExpired = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

export const isDateExpiringSoon = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  return date > now && date <= thirtyDaysFromNow;
};

export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months[month];
};

export const getDayName = (day: number): string => {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  
  return days[day];
};

export const getShortDayName = (day: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day];
};

export const getShortMonthName = (month: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};