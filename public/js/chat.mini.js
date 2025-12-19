document.addEventListener("DOMContentLoaded", function () {
// Enhanced Sidebar toggle functionality with advanced responsive features
        const toggleButton = document.getElementById("toggle-sidebar");
        const sidebar = document.querySelector(".sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        const app = document.querySelector(".app");

        let touchStartX = 0;
        let touchStartY = 0;
        let touchMoveX = 0;
        let isSwipeGesture = false;

        // Function to check if device is mobile
        function isMobile() {
          return window.innerWidth <= 900;
        }

        // Function to toggle sidebar
        function toggleSidebar(force = null) {
          const shouldHide =
            force !== null ? force : !sidebar.classList.contains("hidden");

          if (shouldHide) {
            sidebar.classList.add("hidden");
            overlay.classList.remove("active");
          } else {
            sidebar.classList.remove("hidden");
            if (isMobile()) {
              overlay.classList.add("active");
            }
          }

          // Update aria-expanded for accessibility
          toggleButton.setAttribute("aria-expanded", !shouldHide);

          // Store preference in session storage
          try {
            sessionStorage.setItem("sidebarHidden", shouldHide.toString());
          } catch (e) {
            // Fallback for when sessionStorage is not available
            console.log("SessionStorage not available");
          }
        }

        // Toggle button click event
        toggleButton.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleSidebar();
        });

        // Overlay click to close sidebar on mobile
        overlay.addEventListener("click", function () {
          if (!sidebar.classList.contains("hidden")) {
            toggleSidebar(true);
          }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener("click", function (e) {
          if (isMobile()) {
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnToggle = toggleButton.contains(e.target);

            if (
              !isClickInsideSidebar &&
              !isClickOnToggle &&
              !sidebar.classList.contains("hidden")
            ) {
              toggleSidebar(true);
            }
          }
        });

        // Handle escape key to close sidebar
        document.addEventListener("keydown", function (e) {
          if (
            e.key === "Escape" &&
            !sidebar.classList.contains("hidden") &&
            isMobile()
          ) {
            toggleSidebar(true);
          }
        });

        // Touch/swipe gestures for mobile
        function handleTouchStart(e) {
          if (!isMobile()) return;

          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isSwipeGesture = false;
        }

        function handleTouchMove(e) {
          if (!isMobile() || !touchStartX) return;

          touchMoveX = e.touches[0].clientX;
          const touchMoveY = e.touches[0].clientY;

          const diffX = touchMoveX - touchStartX;
          const diffY = Math.abs(touchMoveY - touchStartY);

          // Check if it's a horizontal swipe (more horizontal than vertical)
          if (Math.abs(diffX) > diffY && Math.abs(diffX) > 30) {
            isSwipeGesture = true;
          }
        }

        function handleTouchEnd(e) {
          if (!isMobile() || !isSwipeGesture || !touchStartX) return;

          const diffX = touchMoveX - touchStartX;
          const swipeThreshold = 50;

          // Swipe right to open sidebar (from left edge)
          if (
            diffX > swipeThreshold &&
            touchStartX < 20 &&
            sidebar.classList.contains("hidden")
          ) {
            e.preventDefault();
            toggleSidebar(false);
          }
          // Swipe left to close sidebar
          else if (
            diffX < -swipeThreshold &&
            !sidebar.classList.contains("hidden")
          ) {
            e.preventDefault();
            toggleSidebar(true);
          }

          // Reset values
          touchStartX = 0;
          touchStartY = 0;
          touchMoveX = 0;
          isSwipeGesture = false;
        }

        // Add touch event listeners
        document.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        document.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd, {
          passive: false,
        });

        // Handle window resize with debouncing
        let resizeTimer;
        window.addEventListener("resize", function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () {
            const wasMobile =
              overlay.classList.contains("active") ||
              sidebar.classList.contains("hidden");

            if (!isMobile()) {
              // Desktop: show sidebar, hide overlay
              overlay.classList.remove("active");
              sidebar.classList.remove("hidden");
            } else if (!wasMobile) {
              // Switched to mobile: hide sidebar initially
              sidebar.classList.add("hidden");
              overlay.classList.remove("active");
            }

            // Update toggle button visibility
            updateToggleButtonVisibility();
          }, 250);
        });

        // Function to update toggle button visibility
        function updateToggleButtonVisibility() {
          if (window.innerWidth > 1200) {
            toggleButton.style.display = "none";
          } else {
            toggleButton.style.display = "flex";
          }
        }

        // Initialize sidebar state based on screen size and stored preference
        function initializeSidebarState() {
          let shouldHide = isMobile();

          // Try to restore previous state
          try {
            const storedState = sessionStorage.getItem("sidebarHidden");
            if (storedState !== null) {
              shouldHide = storedState === "true";
            }
          } catch (e) {
            console.log("SessionStorage not available, using default state");
          }

          // Apply state
          if (shouldHide) {
            sidebar.classList.add("hidden");
            overlay.classList.remove("active");
          } else {
            sidebar.classList.remove("hidden");
            overlay.classList.remove("active");
          }

          updateToggleButtonVisibility();
        }

        // Initialize on load
        initializeSidebarState();

        // Set initial aria attributes
        toggleButton.setAttribute(
          "aria-expanded",
          !sidebar.classList.contains("hidden")
        );

        // Handle dropdown menus
        const dropdowns = document.querySelectorAll(".dropdown");

        dropdowns.forEach((dropdown) => {
          const menu = dropdown.querySelector(".dropdown-menu");

          const toggle = dropdown.querySelector(".dropdown-toggle");
          toggle.addEventListener("click", function (e) {
            e.stopPropagation();

            // Adjust position for mobile
            if (isMobile() && menu.style.display === "block") {
              const rect = menu.getBoundingClientRect();
              const viewportWidth = window.innerWidth;

              if (rect.right > viewportWidth) {
                menu.style.right = "0";
                menu.style.left = "auto";
              }
            }
          });
        });

        // Close dropdowns when clicking outside
        document.addEventListener("click", function () {
          dropdowns.forEach((dropdown) => {
            dropdown.querySelector(".dropdown-menu").style.display = "none";
          });
        });

        // Handle orientation change
        window.addEventListener("orientationchange", function () {
          setTimeout(function () {
            initializeSidebarState();
          }, 100);
        });

        // Prevent zoom on double tap for iOS
        let lastTouchEnd = 0;
        document.addEventListener(
          "touchend",
          function (event) {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
              event.preventDefault();
            }
            lastTouchEnd = now;
          },
          false
        );
      // Handle input focus to prevent viewport zooming on iOS
      const inputs = document.querySelectorAll(
        'input[type="text"], input[type="email"], textarea'
      );
      inputs.forEach((input) => {
        input.addEventListener("focus", function () {
          if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            input.style.fontSize = "16px";
          }
        });

        input.addEventListener("blur", function () {
          if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            input.style.fontSize = "";
          }
        });
      });

      // Performance optimization: Use requestAnimationFrame for smooth animations
      function smoothToggle() {
        requestAnimationFrame(() => {
          sidebar.style.transition =
            "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
        });
      }

      // Add loading state management
      window.addEventListener("beforeunload", function () {
        document.body.style.opacity = "0.8";
      });

      // Accessibility improvements
      toggleButton.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSidebar();
        }
      });

      // Add focus trap for sidebar when open on mobile
      function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener("keydown", function (e) {
          if (e.key === "Tab") {
            if (e.shiftKey) {
              if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
              }
            }
          }
        });
      }

      // Apply focus trap to sidebar
      if (isMobile()) {
        trapFocus(sidebar);
      }

      window.toggleSidebar = toggleSidebar;
          
  });
      