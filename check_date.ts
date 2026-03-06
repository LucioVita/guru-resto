const daysTranslation: Record<string, string> = {
    'Monday': 'lunes',
    'Tuesday': 'martes',
    'Wednesday': 'miercoles',
    'Thursday': 'jueves',
    'Friday': 'viernes',
    'Saturday': 'sabado',
    'Sunday': 'domingo'
};
const now = new Date();
const currentDayEnglish = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
const currentDay = daysTranslation[currentDayEnglish];

console.log("Current Date (ISO):", now.toISOString());
console.log("Current Date (Locale String):", now.toLocaleString());
console.log("Current Day English:", currentDayEnglish);
console.log("Current Day Spanish:", currentDay);
