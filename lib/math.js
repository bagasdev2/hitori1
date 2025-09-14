const chalk = require('chalk');

class MathHelper {
    constructor() {
        this.operations = ['+', '-', '*', '/', '^', 'sqrt', 'sin', 'cos', 'tan', 'log'];
    }

    // Basic calculator
    calculate(expression) {
        try {
            // Security: Only allow safe mathematical expressions
            const safeExpression = expression
                .replace(/[^0-9+\-*/().\s]/g, '')
                .replace(/\s/g, '');

            if (!safeExpression) {
                throw new Error('Invalid expression');
            }

            // Use Function constructor for safe evaluation
            const result = new Function('return ' + safeExpression)();
            
            if (!isFinite(result)) {
                throw new Error('Result is not a finite number');
            }

            return {
                expression: safeExpression,
                result: parseFloat(result.toFixed(10)),
                success: true
            };

        } catch (error) {
            return {
                expression: expression,
                error: error.message,
                success: false
            };
        }
    }

    // Advanced calculator with scientific functions
    scientificCalculate(expression) {
        try {
            let processedExpression = expression
                .toLowerCase()
                .replace(/\s/g, '')
                .replace(/π|pi/g, Math.PI.toString())
                .replace(/e(?![0-9])/g, Math.E.toString())
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/pow\(/g, 'Math.pow(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/\^/g, '**');

            // Security check
            if (!/^[0-9+\-*/.()Math\s,]+$/.test(processedExpression)) {
                throw new Error('Invalid characters in expression');
            }

            const result = new Function('return ' + processedExpression)();

            if (!isFinite(result)) {
                throw new Error('Result is not a finite number');
            }

            return {
                expression: expression,
                processedExpression,
                result: parseFloat(result.toFixed(10)),
                success: true
            };

        } catch (error) {
            return {
                expression: expression,
                error: error.message,
                success: false
            };
        }
    }

    // Generate math problems
    generateProblem(difficulty = 'easy', type = 'arithmetic') {
        try {
            let problem = {};

            switch (type) {
                case 'arithmetic':
                    problem = this.generateArithmetic(difficulty);
                    break;
                case 'algebra':
                    problem = this.generateAlgebra(difficulty);
                    break;
                case 'geometry':
                    problem = this.generateGeometry(difficulty);
                    break;
                case 'trigonometry':
                    problem = this.generateTrigonometry(difficulty);
                    break;
                default:
                    problem = this.generateArithmetic(difficulty);
            }

            return problem;

        } catch (error) {
            console.error(chalk.red('❌ Error generating math problem:'), error);
            return {
                question: '2 + 2',
                answer: 4,
                explanation: '2 + 2 = 4',
                difficulty: 'easy',
                type: 'arithmetic'
            };
        }
    }

    generateArithmetic(difficulty) {
        let num1, num2, operation, answer, question;

        switch (difficulty) {
            case 'easy':
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                operation = ['+', '-'][Math.floor(Math.random() * 2)];
                break;

            case 'medium':
                num1 = Math.floor(Math.random() * 100) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
                break;

            case 'hard':
                num1 = Math.floor(Math.random() * 500) + 1;
                num2 = Math.floor(Math.random() * 100) + 1;
                operation = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
                break;
        }

        // Ensure no negative results for easy level
        if (difficulty === 'easy' && operation === '-' && num2 > num1) {
            [num1, num2] = [num2, num1];
        }

        // For division, ensure clean results
        if (operation === '/') {
            num1 = num2 * Math.floor(Math.random() * 20 + 1);
        }

        switch (operation) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                answer = num1 - num2;
                break;
            case '*':
                answer = num1 * num2;
                break;
            case '/':
                answer = num1 / num2;
                break;
        }

        question = `${num1} ${operation} ${num2}`;

        return {
            question,
            answer: parseFloat(answer.toFixed(2)),
            explanation: `${question} = ${answer}`,
            difficulty,
            type: 'arithmetic',
            timeLimit: this.getTimeLimit(difficulty)
        };
    }

    generateAlgebra(difficulty) {
        let question, answer, explanation;

        switch (difficulty) {
            case 'easy':
                // Simple linear equations: x + a = b
                const a = Math.floor(Math.random() * 20) + 1;
                const b = Math.floor(Math.random() * 30) + a;
                answer = b - a;
                question = `Solve for x: x + ${a} = ${b}`;
                explanation = `x + ${a} = ${b}\nx = ${b} - ${a}\nx = ${answer}`;
                break;

            case 'medium':
                // Linear equations: ax + b = c
                const coeff = Math.floor(Math.random() * 10) + 2;
                const constant = Math.floor(Math.random() * 20) + 1;
                const result = Math.floor(Math.random() * 50) + constant;
                answer = (result - constant) / coeff;
                question = `Solve for x: ${coeff}x + ${constant} = ${result}`;
                explanation = `${coeff}x + ${constant} = ${result}\n${coeff}x = ${result - constant}\nx = ${answer}`;
                break;

            case 'hard':
                // Quadratic equations: x² + bx + c = 0
                const b_coeff = Math.floor(Math.random() * 10) + 1;
                const c_coeff = Math.floor(Math.random() * 20) + 1;
                question = `Find the discriminant of: x² + ${b_coeff}x + ${c_coeff} = 0`;
                answer = (b_coeff * b_coeff) - (4 * 1 * c_coeff);
                explanation = `Discriminant = b² - 4ac\nΔ = ${b_coeff}² - 4(1)(${c_coeff})\nΔ = ${answer}`;
                break;
        }

        return {
            question,
            answer: parseFloat(answer.toFixed(2)),
            explanation,
            difficulty,
            type: 'algebra',
            timeLimit: this.getTimeLimit(difficulty, 'algebra')
        };
    }

    generateGeometry(difficulty) {
        let question, answer, explanation;

        switch (difficulty) {
            case 'easy':
                // Area of rectangle
                const length = Math.floor(Math.random() * 20) + 1;
                const width = Math.floor(Math.random() * 20) + 1;
                answer = length * width;
                question = `Find the area of a rectangle with length ${length}cm and width ${width}cm`;
                explanation = `Area = length × width\nArea = ${length} × ${width} = ${answer} cm²`;
                break;

            case 'medium':
                // Area of circle
                const radius = Math.floor(Math.random() * 15) + 1;
                answer = Math.PI * radius * radius;
                question = `Find the area of a circle with radius ${radius}cm (use π ≈ 3.14159)`;
                explanation = `Area = πr²\nArea = π × ${radius}² = ${answer.toFixed(2)} cm²`;
                break;

            case 'hard':
                // Volume of cylinder
                const r = Math.floor(Math.random() * 10) + 1;
                const h = Math.floor(Math.random() * 15) + 1;
                answer = Math.PI * r * r * h;
                question = `Find the volume of a cylinder with radius ${r}cm and height ${h}cm`;
                explanation = `Volume = πr²h\nVolume = π × ${r}² × ${h} = ${answer.toFixed(2)} cm³`;
                break;
        }

        return {
            question,
            answer: parseFloat(answer.toFixed(2)),
            explanation,
            difficulty,
            type: 'geometry',
            timeLimit: this.getTimeLimit(difficulty, 'geometry')
        };
    }

    generateTrigonometry(difficulty) {
        let question, answer, explanation;
        const angles = [30, 45, 60, 90];

        switch (difficulty) {
            case 'easy':
                const angle1 = angles[Math.floor(Math.random() * angles.length)];
                const func1 = ['sin', 'cos'][Math.floor(Math.random() * 2)];
                const radians1 = (angle1 * Math.PI) / 180;
                
                if (func1 === 'sin') {
                    answer = Math.sin(radians1);
                } else {
                    answer = Math.cos(radians1);
                }
                
                question = `Find ${func1}(${angle1}°)`;
                explanation = `${func1}(${angle1}°) = ${answer.toFixed(4)}`;
                break;

            case 'medium':
                const angle2 = Math.floor(Math.random() * 360);
                const func2 = 'tan';
                const radians2 = (angle2 * Math.PI) / 180;
                answer = Math.tan(radians2);
                question = `Find tan(${angle2}°)`;
                explanation = `tan(${angle2}°) = ${answer.toFixed(4)}`;
                break;

            case 'hard':
                // Convert radians to degrees
                const radian = Math.random() * 2 * Math.PI;
                answer = (radian * 180) / Math.PI;
                question = `Convert ${radian.toFixed(4)} radians to degrees`;
                explanation = `Degrees = radians × (180/π)\nDegrees = ${radian.toFixed(4)} × (180/π) = ${answer.toFixed(2)}°`;
                break;
        }

        return {
            question,
            answer: parseFloat(answer.toFixed(4)),
            explanation,
            difficulty,
            type: 'trigonometry',
            timeLimit: this.getTimeLimit(difficulty, 'trigonometry')
        };
    }

    getTimeLimit(difficulty, type = 'arithmetic') {
        const baseTimes = {
            arithmetic: { easy: 30, medium: 45, hard: 60 },
            algebra: { easy: 45, medium: 90, hard: 120 },
            geometry: { easy: 60, medium: 90, hard: 120 },
            trigonometry: { easy: 30, medium: 60, hard: 90 }
        };

        return (baseTimes[type] || baseTimes.arithmetic)[difficulty] || 30;
    }

    // Mathematical constants and formulas
    getConstants() {
        return {
            π: Math.PI,
            e: Math.E,
            φ: (1 + Math.sqrt(5)) / 2, // Golden ratio
            γ: 0.5772156649015329, // Euler-Mascheroni constant
            √2: Math.sqrt(2),
            √3: Math.sqrt(3),
            ln2: Math.log(2),
            ln10: Math.log(10)
        };
    }

    getFormulas(category = 'all') {
        const formulas = {
            geometry: {
                'Circle Area': 'A = πr²',
                'Circle Circumference': 'C = 2πr',
                'Rectangle Area': 'A = l × w',
                'Rectangle Perimeter': 'P = 2(l + w)',
                'Triangle Area': 'A = ½bh',
                'Sphere Volume': 'V = ⁴⁄₃πr³',
                'Cylinder Volume': 'V = πr²h'
            },
            algebra: {
                'Quadratic Formula': 'x = (-b ± √(b² - 4ac)) / 2a',
                'Distance Formula': 'd = √((x₂-x₁)² + (y₂-y₁)²)',
                'Slope Formula': 'm = (y₂-y₁) / (x₂-x₁)',
                'Point-Slope Form': 'y - y₁ = m(x - x₁)'
            },
            trigonometry: {
                'Pythagorean Identity': 'sin²θ + cos²θ = 1',
                'Law of Sines': 'a/sin(A) = b/sin(B) = c/sin(C)',
                'Law of Cosines': 'c² = a² + b² - 2ab⋅cos(C)',
                'Angle Sum': 'sin(A + B) = sin(A)cos(B) + cos(A)sin(B)'
            }
        };

        return category === 'all' ? formulas : formulas[category] || {};
    }

    // Unit conversions
    convert(value, fromUnit, toUnit) {
        const conversions = {
            // Length
            'mm-cm': 0.1,
            'cm-mm': 10,
            'cm-m': 0.01,
            'm-cm': 100,
            'm-km': 0.001,
            'km-m': 1000,
            'in-cm': 2.54,
            'cm-in': 0.393701,
            'ft-m': 0.3048,
            'm-ft': 3.28084,

            // Area
            'cm2-m2': 0.0001,
            'm2-cm2': 10000,

            // Volume
            'ml-l': 0.001,
            'l-ml': 1000,
            'l-m3': 0.001,
            'm3-l': 1000,

            // Weight
            'g-kg': 0.001,
            'kg-g': 1000,
            'lb-kg': 0.453592,
            'kg-lb': 2.20462,

            // Temperature
            'c-f': (c) => (c * 9/5) + 32,
            'f-c': (f) => (f - 32) * 5/9,
            'c-k': (c) => c + 273.15,
            'k-c': (k) => k - 273.15
        };

        const key = `${fromUnit.toLowerCase()}-${toUnit.toLowerCase()}`;
        const conversion = conversions[key];

        if (typeof conversion === 'function') {
            return conversion(value);
        } else if (typeof conversion === 'number') {
            return value * conversion;
        } else {
            throw new Error(`Conversion from ${fromUnit} to ${toUnit} not supported`);
        }
    }

    // Mathematical sequences
    generateSequence(type, length = 10) {
        const sequences = {
            fibonacci: () => {
                const seq = [0, 1];
                for (let i = 2; i < length; i++) {
                    seq[i] = seq[i-1] + seq[i-2];
                }
                return seq;
            },
            
            prime: () => {
                const primes = [];
                let num = 2;
                while (primes.length < length) {
                    if (this.isPrime(num)) {
                        primes.push(num);
                    }
                    num++;
                }
                return primes;
            },
            
            square: () => {
                return Array.from({ length }, (_, i) => (i + 1) ** 2);
            },
            
            cube: () => {
                return Array.from({ length }, (_, i) => (i + 1) ** 3);
            },
            
            triangular: () => {
                return Array.from({ length }, (_, i) => (i + 1) * (i + 2) / 2);
            }
        };

        return sequences[type] ? sequences[type]() : [];
    }

    isPrime(num) {
        if (num < 2) return false;
        if (num === 2) return true;
        if (num % 2 === 0) return false;
        
        for (let i = 3; i <= Math.sqrt(num); i += 2) {
            if (num % i === 0) return false;
        }
        return true;
    }

    // Statistical functions
    statistics(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) {
            return { error: 'Invalid input' };
        }

        const sorted = [...numbers].sort((a, b) => a - b);
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;
        
        // Median
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        // Mode
        const frequency = {};
        numbers.forEach(num => frequency[num] = (frequency[num] || 0) + 1);
        const maxFreq = Math.max(...Object.values(frequency));
        const mode = Object.keys(frequency).filter(num => frequency[num] === maxFreq).map(Number);

        // Variance and Standard Deviation
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);

        return {
            count: numbers.length,
            sum,
            mean: parseFloat(mean.toFixed(4)),
            median,
            mode: mode.length === numbers.length ? 'No mode' : mode,
            range: sorted[sorted.length - 1] - sorted[0],
            variance: parseFloat(variance.toFixed(4)),
            standardDeviation: parseFloat(stdDev.toFixed(4)),
            min: sorted[0],
            max: sorted[sorted.length - 1]
        };
    }
}

// Create singleton instance
const mathHelper = new MathHelper();

module.exports = mathHelper;