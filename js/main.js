document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, {});
  });

  (function($){
    $(function(){
  
      $('.sidenav').sidenav();
      $('.parallax').parallax();
  
    }); // end of document ready
  })(jQuery); // end of jQuery name space

  
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

function isElementInViewport (el) {
  //special bonus for those using jQuery
  if (typeof jQuery === "function" && el instanceof jQuery) {
    el = el[0];
  }
  var rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
  );
}

// listen for the scroll event
$(document).on("scroll", function() {
  console.log("onscroll event fired...");
  // check if the anchor elements are visible
  $(".anchor").each(function (idx, el) {
    if ( isElementInViewport(el) ) {
      // update the URL hash
      if (window.history.pushState) {
        var urlHash = "#" + $(el).attr("id");
        window.history.pushState(null, null, urlHash);

        if(urlHash == "#about")
          document.getElementById("about-tab").className = "active";
        else
          document.getElementById("about-tab").className = "";

        if(urlHash == "#research")
        document.getElementById("research-tab").className = "active";
        else
          document.getElementById("research-tab").className = "";

        if(urlHash == "#contact-footer")
        document.getElementById("contact-tab").className = "active";
        else
          document.getElementById("contact-tab").className = "";
      }
    }
  });
});