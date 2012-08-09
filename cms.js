(function (global) {
  
  if (!(global.jQuery)) throw new Error('Missing Dependencies: [jQuery]');

  var $ = global.jQuery
    , cms = global.cms = {}
    , elements = cms.elements = {};

  // Types of elements we have
  $.each(['text', 'md', 'image', 'button', 'form'], function () {
    elements[this] = {};
  });

  // Make an element editable. cms-edit has to be loaded
  function editable($el, data) {
    
    $el.data('cms', data);

    $el.on('render', function () {
      var $el = $(this);
      var data = $el.data('cms');
      elements[data.type].render($el, data.data);
      $el.trigger('rendered');
    });

    //add css edit styles
    $el.addClass('cms-edit-' + data.type);

    $el.on('click', function (e) {
      e.preventDefault();
      var $el = $(this);
      var data = $el.data('cms');
      elements[data.type].edit($el, data);
    });

  }

  cms.render = function (pages, _admin) {

    var admin = _admin || false;

    //find elements in dom and render
    for (var pageId in pages) {
      var $page = $('#' + pageId);
      var page = pages[pageId];
      for (var elId in page) {
        var $el = $page.find('[data-cms-id=' + elId + ']');
        var data = page[elId];
        //make some data accessible
        data.page = pageId;
        data.id = elId;
        //Render now
        elements[data.type].render($el, data.data);
        if (admin) editable($el, data);
      }
    }
  };

}(this));
