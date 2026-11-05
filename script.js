
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;

// Update the calculator display
function updateDisplay() {
    expressionDisplay.textContent = expression || "0";
}

// Clear the calculator
function clearCalculator() {
    expression = "";
    justCalculated = false;
    resultDisplay.textContent = "Ready";
    updateDisplay();
}

// Delete the last character
function deleteLast() {
    expression = expression.slice(0, -1);
    justCalculated = false;
    resultDisplay.textContent = "Ready";
    updateDisplay();
}

// Check whether the character is an operator
function isOperator(char) {
    return ["+", "-", "*", "/"].includes(char);
}

// Add a number or operator to the expression
function addInput(value) {
    if (justCalculated) {
        if (/[0-9.]/.test(value)) {
            expression = "";
        }
        justCalculated = false;
    }

    const lastChar = expression.slice(-1);

    // Prevent consecutive operators
    if (isOperator(value)) {
        if (!expression && value !== "-") return;

        if (isOperator(lastChar)) {
            expression = expression.slice(0, -1);
        }
    }

    // Prevent multiple decimal points in one number
    if (value === ".") {
        const currentNumber = expression.split(/[+\-*/%]/).pop();

        if (currentNumber.includes(".")) return;

        if (!currentNumber) {
            expression += "0";
        }
    }

    expression += value;
    resultDisplay.textContent = "Ready";
    updateDisplay();
}

// Toggle the sign of the current number
function toggleSign() {
    if (!expression) {
        expression = "-";
        updateDisplay();
        return;
    }

    const match = expression.match(/(\d*\.?\d+)$/);

    if (!match) return;

    const number = match[0];
    const start = match.index;

    const before = expression.slice(0, start);

    // Toggle the sign of the current number
    if (before.endsWith("-") &&
        (before.length === 1 || isOperator(before.slice(-2, -1)))) {
        expression = before.slice(0, -1) + number;
    } else {
        expression = before + "(-" + number + ")";
    }

    updateDisplay();
}

// Tokenize and safely calculate a mathematical expression
function calculateExpression(input) {
    const tokens = input.match(
        /\d*\.?\d+|[+\-*/%()]|\S/g
    );

    if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
        throw new Error("Invalid expression");
    }

    let position = 0;

    function peek() {
        return tokens[position];
    }

    function consume() {
        return tokens[position++];
    }

    // Handle numbers and parentheses
    function parsePrimary() {
        const token = consume();

        if (token === "(") {
            const value = parseExpression();

            if (consume() !== ")") {
                throw new Error("Missing closing bracket");
            }

            return value;
        }

        const number = Number(token);

        if (!Number.isFinite(number)) {
            throw new Error("Invalid number");
        }

        return number;
    }

    // Handle unary plus and minus
    function parseUnary() {
        if (peek() === "+") {
            consume();
            return parseUnary();
        }

        if (peek() === "-") {
            consume();
            return -parseUnary();
        }

        return parsePrimary();
    }

    // Handle percentage
    function parsePostfix() {
        let value = parseUnary();

        while (peek() === "%") {
            consume();
            value = value / 100;
        }

        return value;
    }

    // Handle multiplication and division
    function parseMultiplication() {
        let value = parsePostfix();

        while (peek() === "*" || peek() === "/") {
            const operator = consume();
            const next = parsePostfix();

            if (operator === "*") {
                value *= next;
            } else {
                if (next === 0) {
                    throw new Error("Cannot divide by zero");
                }

                value /= next;
            }
        }

        return value;
    }

    // Handle addition and subtraction
    function parseExpression() {
        let value = parseMultiplication();

        while (peek() === "+" || peek() === "-") {
            const operator = consume();
            const next = parseMultiplication();

            if (operator === "+") {
                value += next;
            } else {
                value -= next;
            }
        }

        return value;
    }

    const result = parseExpression();

    if (position !== tokens.length) {
        throw new Error("Invalid expression");
    }

    if (!Number.isFinite(result)) {
        throw new Error("Invalid result");
    }

    return result;
}

// Calculate the final result
function calculate() {
    if (!expression) return;

    try {
        const result = calculateExpression(expression);

        // Avoid floating-point display errors
        const roundedResult = Number(result.toPrecision(12));

        resultDisplay.textContent = roundedResult;
        expression = String(roundedResult);
        justCalculated = true;

        updateDisplay();
    } catch (error) {
        resultDisplay.textContent = error.message || "Error";
    }
}

// Handle calculator button clicks using event delegation
buttons.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (action === "clear") {
        clearCalculator();
    } else if (action === "delete") {
        deleteLast();
    } else if (action === "calculate") {
        calculate();
    } else if (action === "sign") {
        toggleSign();
    } else if (value !== undefined) {
        addInput(value);
    }
});

// Handle keyboard input
document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        addInput(key);
    } else if (["+", "-", "*", "/", "%", "."].includes(key)) {
        addInput(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearCalculator();
    }
});

// Initialize calculator
updateDisplay();
