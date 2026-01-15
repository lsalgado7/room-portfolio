// modals.js
import { showModalAnimation, hideModalAnimation } from './animations.js';

export const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact")
}

export function initModalEvents(controls) {
  let touchHappened = false;
  
  document.querySelectorAll(".modal-exit-button").forEach(button=> {
    button.addEventListener("touchend", (e) => {
      touchHappened = true;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModalAnimation(modal, controls);
    }, {passive:false});

    button.addEventListener("click", (e) => {
      if(touchHappened) return;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModalAnimation(modal, controls);
    }, {passive:false});
  })
}

// Add this logic to your event listeners
const showMoreButtons = document.querySelectorAll('.show-more-btn');

showMoreButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Finds the .text-clamp-container div
    const container = button.previousElementSibling; 
    
    const isCollapsed = container.classList.toggle('collapsed');
    
    // Update the button text based on state
    button.textContent = isCollapsed ? 'Show more...' : 'Show less';
  });
});

export const showModal = showModalAnimation;
export const hideModal = hideModalAnimation;