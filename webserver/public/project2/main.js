window.onload = () => {

    const indicatorArray = []
    const binary_display = document.getElementById("binary");

    for(let i = 0; i < 17; i++) {
        indicatorArray[i] = document.getElementById(`loc${i}`);
    }

    setInterval(() => {

        const d = new Date();
        let seconds = d.getSeconds();
        let minutes = d.getMinutes();
        let hours = d.getHours();

        let current_time = seconds + (minutes * 60) + (hours * 60 * 24);
        let current_binary = decimalToBinary(current_time)

        let formatted_binary = "0".repeat(17 - current_binary.length) + current_binary;

        /*
        WHY DOES THIS NOT WORK?!:

        console.log(typeof(formatted_binary));
        console.log(formatted_binary);

        for (x in formatted_binary) {
            if (x = '1') {
                console.log("one")
            }
            else if (x = "0") {
                console.log("zero")
            }
        }
        
        WHY DOES THIS WORK?!:

        Array.from(formatted_binary).forEach(element => {
            if(element == "1") {
                console.log("one")
            }
            else {
                console.log("zero")
            }
        });

        WHY DOES THIS NOT WORK AGAIN?!: (original idea)

        for (let i = 0; i < 17; i++) {
            if(current_binary[i] == '1') {
                indicatorArray[i].classList.add('active');
                indicatorArray[i].classList.remove('inactive');
                console.log('YES')
            }
            else if (current_binary[i] == '0') {
                indicatorArray[i].classList.add('inactive');
                indicatorArray[i].classList.remove('active');
                console.log('NO')
            }
            else {
                binary_display.innerHTML = "FUCK"
            }
        }
        */

        const str = formatted_binary;
        for (let i = 0; i < str.length; i++) {
            console.log(str[i]);
            if(str[i] == "1") {
                console.log("one")
                indicatorArray[i].classList.add('active');
                indicatorArray[i].classList.remove('inactive');
            }
            else {
                console.log("zero")
                indicatorArray[i].classList.add('inactive');
                indicatorArray[i].classList.remove('active');
            }
        };

        binary_display.innerHTML = formatted_binary

    }, 1000)
}

function decimalToBinary(decimalNumber) {
    return decimalNumber.toString(2);
}