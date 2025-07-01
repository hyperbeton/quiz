document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const quizForm = document.getElementById('quizForm');
    const submitBtn = document.getElementById('submitBtn');
    const consoleOutput = document.querySelector('.console-line');
    const formProgress = document.getElementById('formProgress');
    const clickSound = document.getElementById('clickSound');
    const successSound = document.getElementById('successSound');
    
    // Typing effect for console
    const consoleMessages = [
        "Initializing system...",
        "Loading quiz module...",
        "Establishing connection...",
        "Ready to create"
    ];
    
    let currentMessage = 0;
    const consoleInterval = setInterval(() => {
        typeWriter(consoleMessages[currentMessage], () => {
            currentMessage++;
            if (currentMessage >= consoleMessages.length) {
                clearInterval(consoleInterval);
                consoleOutput.textContent = "> System ready";
            }
        });
    }, 1500);
    
    // Typewriter effect
    function typeWriter(text, callback) {
        let i = 0;
        consoleOutput.textContent = "> ";
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                consoleOutput.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
                setTimeout(callback, 500);
            }
        }, 50);
    }
    
    // Update progress bar
    function updateProgressBar() {
        const inputs = quizForm.querySelectorAll('input, select, textarea');
        let filledCount = 0;
        
        inputs.forEach(input => {
            if (input.value.trim() !== '' && input.type !== 'radio') {
                filledCount++;
            }
        });
        
        const radioChecked = quizForm.querySelector('input[type="radio"]:checked');
        if (radioChecked) filledCount++;
        
        const progress = (filledCount / (inputs.length - 3)) * 100;
        formProgress.style.width = `${progress}%`;
    }
    
    // Add event listeners
    quizForm.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', updateProgressBar);
        input.addEventListener('change', updateProgressBar);
        
        input.addEventListener('focus', () => {
            clickSound.currentTime = 0;
            clickSound.play();
        });
    });
    
    // Form submission
    quizForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clickSound.currentTime = 0;
        clickSound.play();
        
        // Get form data
        const category = document.getElementById('category').value;
        const question = document.getElementById('question').value;
        const author = document.getElementById('author').value;
        
        const answers = [
            document.getElementById('answerText1').value,
            document.getElementById('answerText2').value,
            document.getElementById('answerText3').value,
            document.getElementById('answerText4').value
        ];
        
        const correctAnswerIndex = quizForm.querySelector('input[type="radio"]:checked').value;
        
        // Format message for Telegram
        const message = `
📊 *NEW QUIZ* 📊

*Category:* ${category}
*Question:* ${question}

*Answers:*
1. ${answers[0]}
2. ${answers[1]}
3. ${answers[2]}
4. ${answers[3]}

*Correct answer:* ${parseInt(correctAnswerIndex) + 1}

*Author:* ${author}
        `;
        
        // Submit animation
        submitBtn.disabled = true;
        submitBtn.classList.add('float-animation');
        typeWriter("> Sending data to server...", () => {
            consoleOutput.textContent = "> Processing...";
        });
        
        try {
            // Replace with your bot token and chat ID
            const botToken = '7903933591:AAG-tV-rdecchoDl9tz6Fkz1aeXXULuUrUk';
            const chatId = '-1002334913768';
            
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
            
            const result = await response.json();
            
            if (result.ok) {
                successSound.play();
                typeWriter("> Quiz submitted successfully!", () => {
                    consoleOutput.textContent = `> Transaction ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                });
                
                submitBtn.classList.remove('float-animation');
                submitBtn.style.background = `linear-gradient(to right, var(--success), #34d399)`;
                submitBtn.querySelector('.button-text').textContent = "SUCCESS";
                
                setTimeout(() => {
                    quizForm.reset();
                    formProgress.style.width = '0%';
                    submitBtn.style.background = '';
                    submitBtn.querySelector('.button-text').textContent = "SUBMIT QUIZ";
                    submitBtn.disabled = false;
                    consoleOutput.textContent = "> Ready for new quiz";
                }, 3000);
            } else {
                throw new Error(result.description || 'Unknown error');
            }
        } catch (error) {
            consoleOutput.textContent = `> Error: ${error.message}`;
            submitBtn.classList.remove('float-animation');
            submitBtn.style.background = `linear-gradient(to right, var(--error), #f87171)`;
            submitBtn.querySelector('.button-text').textContent = "ERROR";
            
            setTimeout(() => {
                submitBtn.style.background = '';
                submitBtn.querySelector('.button-text').textContent = "SUBMIT QUIZ";
                submitBtn.disabled = false;
            }, 2000);
            
            console.error(error);
        }
    });
    
    // 3D tilt effect
    let mouseX = 0, mouseY = 0;
    let containerX = 0, containerY = 0;
    const container = document.querySelector('.app-container');
    const sensitivity = 0.03;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * sensitivity;
        mouseY = (e.clientY - window.innerHeight / 2) * sensitivity;
    });
    
    function animateContainer() {
        containerX += (mouseX - containerX) * 0.1;
        containerY += (mouseY - containerY) * 0.1;
        
        container.style.transform = `perspective(1000px) rotateX(${-containerY}deg) rotateY(${containerX}deg)`;
        
        requestAnimationFrame(animateContainer);
    }
    
    animateContainer();
});