(() =>
{

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {type, params} = message;
    if (type === "latex-director-open-box") {
      pathChooser(params.simplifiedFormula);
    }
  });
  
  
  
  
  
  function pathChooser(str) {
      if (str.includes("/")) {
        // Separate the input string into two parts
        const index = str.indexOf("/");
        const firstString = str.slice(0, index);
        const secondString = str.slice(index + 1);
    
        // Convert the strings to integer values
        const numerator = parseInt(firstString);
        const denominator = parseInt(secondString);
    
        // Call the function to display the fraction box
        displayFractionBox(numerator, denominator);
      } else {
        // Convert the input string to an integer value
        const value = parseInt(str);
    
        // Call the function to display the integer box
        displayFractionValue(value);
      }
    }
    
    function displayFractionBox(numerator, denominator) {
      // Create the fraction box HTML elements
      const fractionBox = document.createElement("div");
      fractionBox.style.padding = "10px";
      fractionBox.style.display = "inline-block";
    
      const numeratorDiv = document.createElement("div");
      numeratorDiv.style.textAlign = "center";
      numeratorDiv.style.fontSize = "24px";
      numeratorDiv.textContent = numerator;
      fractionBox.appendChild(numeratorDiv);
    
      const divisionDiv = document.createElement("div");
      divisionDiv.style.textAlign = "center";
      divisionDiv.style.fontSize = "16px";
      divisionDiv.textContent = "—";
      fractionBox.appendChild(divisionDiv);
    
      const denominatorDiv = document.createElement("div");
      denominatorDiv.style.textAlign = "center";
      denominatorDiv.style.fontSize = "24px";
      denominatorDiv.textContent = denominator;
      fractionBox.appendChild(denominatorDiv);
    
      // Create the popup box HTML elements
      const popupBox = document.createElement("div");
      popupBox.style.position = "fixed";
      popupBox.style.top = "70%";
      popupBox.style.left = "80%";
      popupBox.style.transform = "translate(-50%, -50%)";
      popupBox.style.padding = "35px";
      popupBox.style.background = "#fff";
      popupBox.style.border = "1px solid #ccc";
      popupBox.style.borderRadius = "5px";
      popupBox.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.3)";
      popupBox.style.zIndex = "9999";
    
      popupBox.innerHTML = "= <div style='display: inline-block; text-align: center; width: 100%;'>" + numerator + "</div><br>" + "<div style='display: inline-block; width: 100%; border-top: 1px solid black; text-align: center;'>" + denominator + "</div>";
    
      // Append the popup box to the document body
      document.body.appendChild(popupBox);
      // Add event listener to close popup box on click outside of it
      document.addEventListener("click", (event) => {
      if (!popupBox.contains(event.target)) {
        popupBox.remove();
      }
    });
    }
    
    function displayFractionValue(value) {
      // Create the integer box HTML elements
      const fractionBox = document.createElement("div");
      fractionBox.style.padding = "10px";
      fractionBox.style.display = "inline-block";
    
      const valueDiv = document.createElement("div");
      valueDiv.style.textAlign = "center";
      valueDiv.style.fontSize = "100px";
      valueDiv.textContent = value;
      fractionBox.appendChild(valueDiv);
    
      // Create the popup box HTML elements
      const popupBox = document.createElement("div");
      popupBox.style.position = "fixed";
      popupBox.style.top = "70%";
      popupBox.style.left = "80%";
      popupBox.style.transform = "translate(-50%, -50%)";
      popupBox.style.padding = "40px";
      popupBox.style.background = "#fff";
      popupBox.style.border = "1px solid #ccc";
      popupBox.style.borderRadius = "5px";
      popupBox.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.3)";
      popupBox.style.zIndex = "9999";
    
      popupBox.innerHTML = "= <div style='display: inline-block; text-align: 	center;						   width: 100%;'>" + value + "</div>";
    
      document.body.appendChild(popupBox);
      // Add event listener to close popup box on click outside of it
      document.addEventListener("click", (event) => {
        if (!popupBox.contains(event.target)) {
          popupBox.remove();
        }
      });
    }
})();