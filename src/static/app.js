document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list" style="list-style-type: none; padding: 0;">
                ${details.participants
                  .map(
                    email => `<li class="participant-item">${email} <button class="delete-participant" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <span class="no-participants">No one has signed up yet.</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listener for delete buttons
      document.querySelectorAll(".delete-participant").forEach(button => {
        button.addEventListener("click", async (event) => {
          const activity = event.target.dataset.activity;
          const email = event.target.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
              {
                method: "DELETE",
              }
            );

            if (response.ok) {
              // Remove the participant from the list dynamically
              const participantItem = event.target.closest("li");
              const participantsList = participantItem.closest("ul");
              participantItem.remove();

              // If no participants remain, show the "No one has signed up yet" message
              if (participantsList.children.length === 0) {
                const participantsSection = participantsList.closest(".participants-section");
                participantsSection.innerHTML = `<strong>Participants:</strong><span class="no-participants">No one has signed up yet.</span>`;
              }
            } else {
              console.error("Failed to unregister participant");
            }
          } catch (error) {
            console.error("Error unregistering participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Dynamically update the participant list
        const activityCard = Array.from(document.querySelectorAll(".activity-card"))
          .find(card => card.querySelector("h4").textContent === activity);

        if (activityCard) {
          const participantsSection = activityCard.querySelector(".participants-section");
          const participantsList = participantsSection.querySelector(".participants-list");
          const noParticipantsMessage = participantsSection.querySelector(".no-participants");

          // Remove "No one has signed up yet" message if it exists
          if (noParticipantsMessage) {
            noParticipantsMessage.remove();
          }

          // Add the new participant to the list
          if (participantsList) {
            const newParticipantItem = document.createElement("li");
            newParticipantItem.className = "participant-item";
            newParticipantItem.innerHTML = `${email} <button class="delete-participant" data-activity="${activity}" data-email="${email}">❌</button>`;
            participantsList.appendChild(newParticipantItem);

            // Add event listener to the new delete button
            newParticipantItem.querySelector(".delete-participant").addEventListener("click", async (event) => {
              const activity = event.target.dataset.activity;
              const email = event.target.dataset.email;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
                  {
                    method: "DELETE",
                  }
                );

                if (response.ok) {
                  // Remove the participant from the list dynamically
                  const participantItem = event.target.closest("li");
                  const participantsList = participantItem.closest("ul");
                  participantItem.remove();

                  // If no participants remain, show the "No one has signed up yet" message
                  if (participantsList.children.length === 0) {
                    const participantsSection = participantsList.closest(".participants-section");
                    participantsSection.innerHTML = `<strong>Participants:</strong><span class="no-participants">No one has signed up yet.</span>`;
                  }
                } else {
                  console.error("Failed to unregister participant");
                }
              } catch (error) {
                console.error("Error unregistering participant:", error);
              }
            });
          }
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
