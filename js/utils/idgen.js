let counter = 0;


export function generateId(prefix = "note"){
    counter++;
    const timeStamp = Date.now();
    return `${prefix}-${timeStamp}-${counter}`;
}


