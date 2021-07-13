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
  