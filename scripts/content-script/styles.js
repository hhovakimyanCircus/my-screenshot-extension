const overlayStyles = {
    background: 'rgba(0, 0, 0, .5)',
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    'z-index': 100,
    display: 'flex',
    'justify-content': 'center',
    'align-items': 'center',
};

const overlayTextStyles = {
    color: '#fff',
    'font-size': '47px',
    'font-weight': 700,
};

const stopRecordingButtonWrapperStyles = {
    width: '225px',
    padding: '25px 0',
    'border-radius': '7px',
    'box-shadow': '0px 0px 19px 13px #00000040',
    'background-color': 'grey',
    position: 'fixed',
    bottom: '30px',
    left: '30px',
    display: 'flex',
    'justify-content': 'center',
    'z-index': 50,
}

const stopRecordingButtonStyles = {
    'background-color': '#FF5C77',
    color: '#fff',
    'font-weight': 700,
    'font-size': '18px',
    'text-align': 'center',
    'border-radius': '7px',
    cursor: 'pointer',
    padding: '7px 16px',
    outline: 'none',
    width: '166px',
    border: 0,
}

const highlightNodeStyles = {
    position: 'absolute',
    'z-index': 1000,
    display: 'block',
    width: '30px',
    height: '30px'
}