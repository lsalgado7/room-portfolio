// modals.js
import { showModalAnimation, hideModalAnimation } from './animations.js';

export let isModalActive = false;

export const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact")
}

export function initModalEvents(controls) {
  // show more toggle logic
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

  let touchHappened = false;
  
  // exit button logic
  document.querySelectorAll(".modal-exit-button").forEach(button=> {
    button.addEventListener("touchend", (e) => {
      touchHappened = true;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal, controls);
    }, {passive:false});

    button.addEventListener("click", (e) => {
      if(touchHappened) return;
      e.preventDefault();
      const modal = e.target.closest(".modal");
      hideModal(modal, controls);
    }, {passive:false});
  })
}


export const showModal = (modal, controls) => {
  isModalActive = true;
  if (controls) controls.enabled = false; // Disable OrbitControls
  showModalAnimation(modal);
};

export const hideModal = (modal, controls) => {
  hideModalAnimation(modal);
  isModalActive = false;
  if (controls) {
    controls.enabled = true; // Re-enable OrbitControls
    controls.update();
  }
};