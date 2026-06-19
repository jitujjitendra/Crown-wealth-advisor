/**
 * Performance Optimizations
 * Image lazy loading, resource hints, and other optimizations
 */

(function() {
  'use strict';

  // ========================================
  // 1. Image Lazy Loading with Intersection Observer
  // ========================================
  
  function initLazyLoading() {
    // Check if browser supports Intersection Observer
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      
      const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Set src from data-src if available
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            
            // Set srcset from data-srcset if available
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
              img.removeAttribute('data-srcset');
            }
            
            // Remove loading attribute once loaded
            img.removeAttribute('loading');
            
            // Stop observing this image
            observer.unobserve(img);
          }
        });
      }, {
        root: null,
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      });
      
      // Observe all lazy images
      lazyImages.forEach(function(img) {
        imageObserver.observe(img);
      });
    } else {
      // Fallback for browsers without Intersection Observer
      // Just load all images immediately
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(function(img) {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
      });
    }
  }

  // ========================================
  // 2. Preload Critical Resources
  // ========================================
  
  function preloadCriticalResources() {
    // Preload critical fonts (if you add custom fonts)
    // const fontLink = document.createElement('link');
    // fontLink.rel = 'preload';
    // fontLink.as = 'font';
    // fontLink.type = 'font/woff2';
    // fontLink.href = '/assets/fonts/your-font.woff2';
    // fontLink.crossOrigin = 'anonymous';
    // document.head.appendChild(fontLink);
  }

  // ========================================
  // 3. Defer Non-Critical CSS
  // ========================================
  
  function loadDeferredCSS() {
    const deferredStyles = document.querySelectorAll('link[rel="preload"][as="style"]');
    deferredStyles.forEach(function(link) {
      link.onload = function() {
        link.rel = 'stylesheet';
      };
    });
  }

  // ========================================
  // 4. Reduce Layout Shifts (CLS)
  // ========================================
  
  function preventLayoutShifts() {
    // Add aspect ratio containers for images without dimensions
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(function(img) {
      // Set dimensions based on natural size once loaded
      if (img.complete) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;
      } else {
        img.addEventListener('load', function() {
          img.width = img.naturalWidth;
          img.height = img.naturalHeight;
        });
      }
    });
  }

  // ========================================
  // 5. Service Worker Registration (for PWA)
  // ========================================
  
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        // Uncomment when you create a service worker
        // navigator.serviceWorker.register('/sw.js')
        //   .then(function(registration) {
        //     console.log('Service Worker registered:', registration);
        //   })
        //   .catch(function(error) {
        //     console.log('Service Worker registration failed:', error);
        //   });
      });
    }
  }

  // ========================================
  // 6. Resource Hints for External Domains
  // ========================================
  
  function addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
      { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: true }
    ];
    
    hints.forEach(function(hint) {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  // ========================================
  // 7. Debounce Scroll Events
  // ========================================
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  // ========================================
  // 8. Monitor Performance Metrics
  // ========================================
  
  function monitorPerformance() {
    // Check if Performance API is available
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver(function(list) {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          // Send to analytics if available
          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(lastEntry.startTime),
              non_interaction: true
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver(function(list) {
          const entries = list.getEntries();
          entries.forEach(function(entry) {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'web_vitals', {
                event_category: 'Web Vitals',
                event_label: 'FID',
                value: Math.round(entry.processingStart - entry.startTime),
                non_interaction: true
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }

      // Monitor Cumulative Layout Shift (CLS)
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver(function(list) {
          list.getEntries().forEach(function(entry) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Report CLS on page visibility change
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'hidden' && typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'CLS',
              value: Math.round(clsScore * 1000),
              non_interaction: true
            });
          }
        });
      } catch (e) {
        // CLS not supported
      }
    }
  }

  // ========================================
  // 9. Initialize All Optimizations
  // ========================================
  
  function init() {
    // Run immediately
    addResourceHints();
    preloadCriticalResources();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        initLazyLoading();
        loadDeferredCSS();
        preventLayoutShifts();
        monitorPerformance();
      });
    } else {
      // DOM already loaded
      initLazyLoading();
      loadDeferredCSS();
      preventLayoutShifts();
      monitorPerformance();
    }
    
    // Register service worker after page load
    registerServiceWorker();
  }

  // Start optimization
  init();

  // Export debounce for external use
  window.performanceUtils = {
    debounce: debounce
  };

})();
