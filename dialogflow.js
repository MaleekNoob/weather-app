$(document).ready(function() {
    const apiKey = 'AIzaSyCAV73EKedKhVm3Vslz389wY6_OB1z2aw0'; // Replace with your Dialogflow API key
    const projectId = 'ace-line-420812'; // Replace with your Dialogflow project ID
  
    // Function to send a message to Dialogflow and handle the response
    function sendMessage(message) {
      $.ajax({
        type: 'POST',
        url: `https://api.dialogflow.com/v1/query?key=${apiKey}`,
        data: JSON.stringify({
          query: message,
          sessionId: 'uniqueSessionId' // Replace with a unique session ID
        }),
        contentType: 'application/json',
        success: function(response) {
          const textResponse = response.fulfillmentText;
          displayMessage('You:', message);
          displayMessage('Bot:', textResponse);
        },
        error: function(error) {
          console.error('Error:', error);
          displayMessage('Bot:', 'Sorry, I couldn\'t understand your request.');
        }
      });
    }
  
    // Function to display a message in the chat window
    function displayMessage(sender, message) {
      const chatMessages = $('#chat-messages');
      chatMessages.append(`<div class="message"><span>${sender}:</span> ${message}</div>`);
      chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }
  
    // Handle message input
    $('#message-input').keypress(function(event) {
      if (event.which === 13) {
        const message = $(this).val();
        if (message.trim() !== '') {
          sendMessage(message);
          $(this).val('');
        }
        event.preventDefault();
      }
    });
  });