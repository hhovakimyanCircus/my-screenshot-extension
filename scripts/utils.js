
function generateUniqueSessionId() {
    const randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    let hex = '';
    for (let i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }

    return hex;
}

function convertCssStylesToText(styles) {
    return Object.keys(styles)
        .reduce(
            (accumulator, currentValue) => accumulator + `${currentValue}:${styles[currentValue]};`,
            ''
        )
        .slice(0, -1);
}