(() => {
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type, params} = obj;

        if (type == "latex-director-simplify-request")
        {
            let formula = getSimplifiedFormula(params.selectedText);
            
            if (formula !== null)
            {
                // Send message to background page to open box
                chrome.runtime.sendMessage({
                    type: "latex-director-bg-open-box",
                    params: {
                        simplifiedFormula: formula
                    }
                });
            }
            else
            {

            }
        }
    })

    function getSimplifiedFormula(formula)
    {
        // Validate
        if (!parserCheckValid(formula))
            return null;

        // Parse LaTeX
        formula = convertFormula(formula);

        // Simplify
        formula = simplify(formula);

        // Beautify
        formula = beautify(formula);

        return formula;
    }

    function parserCheckValid(string)
    {
        /*
            Examples:
            string = "1\cdot 2"     --> Correct
            string = "(1\cdot 2)"   --> Correct
            string = "({2)}"        --> Fail
            string = "(1 2)"        --> Fail
            string = "(1 + 2"       --> Fail
        */

        return true;
    }

    function beautify(formula)
    {
        formula = formula.replace(/\(|\)/g, "");
        let match = formula.match(/(-?\d+)\/(-?\d+)/);
        let result = formula;

        if (match !== null)
        {
            let matchGcd = gcd(Number(match[1]), Number(match[2]));
            
            let numerator = Math.abs(Number(match[1]) / matchGcd);
            let denominator = Math.abs(Number(match[2]) / matchGcd);
            
            let minusPart = (Math.sign(Number(match[1]) * Number(match[2])) === -1) ? "-" : "";
            let numberPart = (denominator !== 1) ? numerator + "/" + denominator : numerator;

            result = minusPart + numberPart;
        }

        return result;
    }

    function gcd(num1, num2) {
        if (num2 === 0) {
            return Math.abs(num1);
        } else {
            return gcd(num2, num1 % num2);
        }
    }

    function convertFormula(formula) {
        formula = formula.replace(/\\cdot/g, '*');
        formula = formula.replace(/\b(\d+)\b/g, '($1)'); /* add () to numbers */
        formula = formula.replace(/\(\((\d+)\)\)/g,'($1)'); /* delete extra () */
        formula = formula.replace(/\s/g, ""); /* delete space */
        formula = replaceFractions(formula);
        return formula; 
      }

    function replaceFractions(formula) // \frac{\frac{1}{2}}{3}
    {
        const regex = /\\frac{([-\d+*()\/]*)}{([-\d+*()\/]*)}/;
        let before = formula;
        let after = before.replace(regex, "(($1)/($2))");

        while (after !== before)
        {
            before = after;
            after = before.replace(regex, "(($1)/($2))");
        }

        return after;
    }

    function simplify(formula)
    {
        let before = formula;
        let after = simplify_oneStep(before);

        while (before !== after)
        {
            before = after;
            after = simplify_oneStep(before);
        }

        return after;
    }

    function simplify_oneStep(formula)
    {
        // Parentheses
        if (formula.match(/\(\((-?\d+)\)\)/) || formula.match(/\(\(\((-?\d+)\)\/\((-?\d+)\)\)\)/))
            return parentheses_removeExtra(formula);
        
        let outerMostParenthesesContent = parentheses_getOutermostParenthesesContent(formula);
        if (outerMostParenthesesContent != null)
            return formula.replace(new RegExp("(?<=^.{" + outerMostParenthesesContent.index + "}).{" + outerMostParenthesesContent.content.length + "}"), simplify(outerMostParenthesesContent.content))

        // Multiplication
        if (formula.match(/\((-?\d+)\)\*\((-?\d+)\)/))
            return multiplication_simplifyConstantTimesConstant(formula);

        if (formula.match(/\((-?\d+)\)\*\(\((-?\d+)\)\/\((-?\d+)\)\)/))
            return multiplication_simplifyConstantTimesFraction(formula);

        if (formula.match(/\(\((-?\d+)\)\/\((-?\d+)\)\)\*\((-?\d+)\)/))
            return multiplication_simplifyFractionTimesConstant(formula);
        
        if (formula.match(/\(\((-?\d+)\)\/\((-?\d+)\)\)\*\(\((-?\d+)\)\/\((-?\d+)\)\)/))
            return multiplication_simplifyFractionTimesFraction(formula);

        // Division
        if (formula.match(/\((-?\d+)\)\/\(\((-?\d+)\)\/\((-?\d+)\)\)/))
            return division_simplifyConstantDividedByFraction(formula);

        if (formula.match(/\(\((-?\d+)\)\/\((-?\d+)\)\)\/\((-?\d+)\)/))
            return division_simplifyFractionDividedByConstant(formula);

        if (formula.match(/\(\((-?\d+)\)\/\((-?\d+)\)\)\/\(\((-?\d+)\)\/\((-?\d+)\)\)/))
            return division_simplifyFractionDividedByFraction(formula);

        // Convert subtraction
        if (formula.match(/-\(/)) // formula contains '-(', so '-(1)' or '-((1)/(2))' will match, but '(-1)' will not.
            return subtraction_convertToAddition(formula);

        // Addition
        if (formula.match(/\((-?\d+)\)\+\((-?\d+)\)/))
            return addition_simplifyConstantPlusConstant(formula);
        
        if (formula.match(/\((?<c>-?\d+)\)\+\(\((?<a>-?\d+)\)\/\((?<b>-?\d+)\)\)/))
            return addition_simplifyConstantPlusFraction(formula);

        if (formula.match(/\(\((?<a>-?\d+)\)\/\((?<b>-?\d+)\)\)\+\((?<c>-?\d+)\)/))
            return addition_simplifyFractionPlusConstant(formula);

        if (formula.match(/\(\((?<a>-?\d+)\)\/\((?<b>-?\d+)\)\)\+\(\((?<c>-?\d+)\)\/\((?<d>-?\d+)\)\)/))
            return addition_simplifyFractionPlusFraction(formula);

        // Done
        return formula;
    }

    function parentheses_getOutermostParenthesesContent(formula)
    {
        // Example:
        // formula = "(1)+((2)+(3))" --> result = "(2)+(3)"
        let content = "";
        let startIndex = 0;
        let readContent = false;
        let parenthesisCounter = 0;
        for (let i = 0; i < formula.length; i++)
        {
            readContent = parenthesisCounter > 0;
            
            // Whenever a parenthesis is opened
            if (formula[i] === '(')
            {
                parenthesisCounter++;
                
                // If it is the first parenthesis, set startIndex to i
                if (parenthesisCounter == 1)
                    startIndex = i + 1;
            }

            // Whenever a parenthesis is closed
            if (formula[i] === ')')
            {
                parenthesisCounter--;
            
                // If parenthesisCounter is 0, we know it has closed the first parenthesis
                if (parenthesisCounter === 0)
                {
                    // Return content and startIndex if it is not a constant or fraction (startIndex is important when we want to replace the stuff in parentheses with the simplified variant) 
                    // Note that `content` will be '2' if it was a constant and not '(2)', because the parentheses aren't kept. The same goes for fractions.
                    if (!content.match(/^-?\d+$/) && !content.match(/^\(-?\d+\)\/\(-?\d+\)$/))
                    {
                        return {
                            content: content,
                            index: startIndex
                        }
                    }

                    // Otherwise, the content was a constant/fraction. In that case we reset the content
                    content = "";
                }
            }
            
            // readContent will be true whenever it has started reading characters after the initial '('.
            // parenthesisCounter will be 0 whenever it has found the closing parenthesis corresponding to the initial '(' or when the initial parenthesis hasn't been found yet.
            // This effectively means, that it will only read characters into `content` whenever it is in between the first '(' and its corresponding ')'
            if (readContent && parenthesisCounter !== 0)
                content += formula[i];
        }
        
        return null;
    }

    /****** Simplify ruleset ******/
    // Parentheses
    function parentheses_removeExtra(formula){
        return formula.replace(/\(\((-?\d+)\)\)/g, '($1)') // ((constant)) --> (constant)
                      .replace(/\(\(\((-?\d+)\)\/\((-?\d+)\)\)\)/g, '(($1)/($2))'); // (((c1)/(c2))) --> ((c1)/(c2)) 
    }

    // Multiplication
    function multiplication_simplifyConstantTimesConstant(formula)
    {
        const match = formula.match(/\((-?\d+)\)\*\((-?\d+)\)/);
        const multiplyResult = "(" + (Number(match[1]) * Number(match[2])).toString() + ")";
        const substringRegex = new RegExp("(?<=^.{" + match.index + "}).{" + match[0].length + "}");
        return formula.replace(substringRegex, multiplyResult);
    }

    function multiplication_simplifyFractionTimesFraction(formula){
        const match = formula.match(/\(\((-?\d+)\)\/\((-?\d+)\)\)\*\(\((-?\d+)\)\/\((-?\d+)\)\)/);
        const multiplyResult = "((" + (Number(match[1]) * Number(match[3])).toString() + ")/(" + (Number(match[2])*Number(match[4])).toString() + "))";
        const substringRegex = new RegExp("(?<=^.{" + match.index +"}).{" + match[0].length + "}");
        return formula.replace(substringRegex, multiplyResult);
    }

    function multiplication_simplifyConstantTimesFraction(formula){
        const match = formula.match(/\((-?\d+)\)\*\(\((-?\d+)\)\/\((-?\d+)\)\)/);
        const multiplyResult = "((" + (Number(match[1]) * Number(match[2])).toString() + ")/(" + (Number(match[3])*1).toString() + "))";
        const substringRegex = new RegExp("(?<=^.{" + match.index +"}).{" + match[0].length + "}");
        return formula.replace(substringRegex, multiplyResult);
    }

    function multiplication_simplifyFractionTimesConstant(formula){
        const match = formula.match(/\(\((-?\d+)\)\/\((-?\d+)\)\)\*\((-?\d+)\)/);
        const multiplyResult = "((" + (Number(match[1]) * Number(match[3])).toString() + ")/(" + (Number(match[2])*1).toString() + "))";
        const substringRegex = new RegExp("(?<=^.{" + match.index +"}).{" + match[0].length + "}");
        return formula.replace(substringRegex, multiplyResult);
    }

    // Division
    function division_simplifyConstantDividedByFraction(formula){
        const regex = /\((-?\d+)\)\/\(\((-?\d+)\)\/\((-?\d+)\)\)/;
        if(regex.exec(formula) != null)
                formula = formula.replace(regex, "((($1)*($3))/($2))");
        return formula;
    }
    
    function division_simplifyFractionDividedByConstant(formula){
        const regex = /\(\((-?\d+)\)\/\((-?\d+)\)\)\/\((-?\d+)\)/;
        if(regex.exec(formula) != null)
           formula = formula.replace(regex, "(($1)/(($2)*($3)))");
        return formula;
    }
    
    function division_simplifyFractionDividedByFraction(formula){
        const regex = /\(\((-?\d+)\)\/\((-?\d+)\)\)\/\(\((-?\d+)\)\/\((-?\d+)\)\)/;
        if(regex.exec(formula) != null)
            formula = formula.replace(regex, "((($1)*($4))/(($2)*($3)))");
    
        return formula;
    }

    // Addition
    function addition_simplifyConstantPlusConstant(formula)
    {
        const match = formula.match(/\((-?\d+)\)\+\((-?\d+)\)/);
        const additionResult = "(" + (Number(match[1]) + Number(match[2])).toString() + ")";
        const substringRegex = new RegExp("(?<=^.{" + match.index + "}).{" + match[0].length + "}");
        return formula.replace(substringRegex, additionResult);
    }

    function addition_simplifyFractionPlusFraction(formula)
    {
        // From:    ((a)/(b))+((c)/(d))
        // To:      (( (a*d) + (b*c) ) / ( b*d )) 
        return formula.replace(/\(\((?<a>-?\d+)\)\/\((?<b>-?\d+)\)\)\+\(\((?<c>-?\d+)\)\/\((?<d>-?\d+)\)\)/, '((($<a>)*($<d>)+($<b>)*($<c>))/(($<b>)*($<d>)))')
    }

    function addition_simplifyConstantPlusFraction(formula)
    {
        // From:    (constant) + ((numerator)/(denominator))
        // To:      (( (numerator) + ((constant)*(denominator)) ) / (denominator))
        return formula.replace(/\((?<c>-?\d+)\)\+\(\((?<a>-?\d+)\)\/\((?<b>-?\d+)\)\)/, '((($<a>)+(($<c>)*($<b>)))/($<b>))')
    }

    function addition_simplifyFractionPlusConstant(formula)
    {
        // From:    ((numerator)/(denominator)) + (constant)
        // To:      (( (numerator) + ((constant)*(denominator)) ) / (denominator))
        return formula.replace(/\(\((?<a>-?\d+)\)\/\((?<b>-?\d+)\)\)\+\((?<c>-?\d+)\)/, '((($<a>)+(($<c>)*($<b>)))/($<b>))')
    }

    // Subtraction
    function subtraction_convertToAddition(formula){
        /* convert negative fraction:*/
        formula = formula.replace(/-\(\((\d+)\)\/\((\d+)\)\)/g, "+((-$1)/($2))");
        //formula = formula.replace(/-\(\((\d+)\)\/\((-?\d+)\)\)/g, "+((-1)*($1))/($2)");
        formula = formula.replace(/-\(\(\-(\d+)\)\/\((\d+)\)\)/g, "+(($1)/($2))");
        
        /* convert negative constant: */
        formula = formula.replace(/-\((\d+)\)/g, "+(-$1)");
        /* formula = formula.replace(/-\((\d+)\)/g, "+((-1)*$1)"); */
        formula = formula.replace(/-\(\-(\d+)\)/g, "+($1)");
        
        /* if + is standing alone, delete it */
        formula = formula.replace(/\(\+/g, '(');
        if(formula.charAt(0) == '+') formula = formula.substring(1);
        return formula;
    } 
})();