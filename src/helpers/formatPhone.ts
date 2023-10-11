export const formatPhone = (number: string) => {
    if (number.includes('@')) number = number.split('@')[0];
    if (number.includes(':')) number = number.split(':')[0];
    return number;
};
