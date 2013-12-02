(function() {
  jQuery(function($) {
    $.fn.stripClass = function(partialMatch, endOrBegin) {
      var x;
      x = new RegExp((!endOrBegin ? "\\b" : "\\S+") + partialMatch + "\\S*", 'g');
      this.attr('class', function(i, c) {
        if (!c) {
          return;
        }
        return c.replace(x, '');
      });
      return this;
    };
    $.onepage_scroll = function(element, options) {
      var supportTransition;
      this.settings = {};
      this.$element = $(element);
      this.state = '';
      this.quietPeriod = 500;
      supportTransition = function() {
        return Modernizr.csstransitions && Modernizr.csstransforms3d;
      };
      this.transformPage = function(index, callback) {
        var pos,
          _this = this;
        callback = typeof callback !== 'function' ? $.noop : callback;
        pos = ((index - 1) * 100) * -1;
        if (!supportTransition()) {
          this.$element.animate({
            top: "" + pos + "%"
          }, function() {
            _this.settings.afterMove(index);
            return callback(index);
          });
        } else {
          this.$element.css({
            "transform": "translate3d(0, " + pos + "%, 0)",
            "transition": "all " + this.settings.animationTime + "ms " + this.settings.easing,
            "-webkit-transform": "translate3d(0, " + pos + "%, 0)",
            "-webkit-transition": "all " + this.settings.animationTime + "ms " + this.settings.easing
          });
          this.$element.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
            _this.settings.afterMove(index);
            return callback(index);
          });
        }
        return this;
      };
      this.moveDown = function() {
        var index;
        index = $("" + this.settings.sectionContainer + ".active").data("index");
        return this.moveTo(index + 1);
      };
      this.moveUp = function() {
        var index;
        index = $("" + this.settings.sectionContainer + ".active").data("index");
        return this.moveTo(index - 1);
      };
      this.moveTo = function(page_index) {
        var current, current_index, index, next,
          _this = this;
        current = $("" + this.settings.sectionContainer + ".active");
        current_index = current.data('index');
        if (page_index === current_index) {
          return;
        }
        index = page_index;
        if (this.settings.smooth && Math.abs(current_index - page_index) > 1) {
          index = page_index > current_index ? current_index + 1 : current_index - 1;
        }
        if (index < 1 || index > this.total) {
          if (this.settings.loop) {
            index = index < 1 ? this.total : 1;
          } else {
            return;
          }
        }
        next = $("" + this.settings.sectionContainer + "[data-index='" + index + "']");
        this.settings.beforeMove(current.data("index"));
        current.removeClass("active");
        next.addClass("active");
        if (this.settings.pagination) {
          $(".onepage-pagination li a.active").removeClass("active");
          $(".onepage-pagination li a[data-index='" + index + "']").addClass("active");
        }
        $("body").removeClass("viewing-page-" + (current.data("index"))).addClass("viewing-page-" + (next.data("index")));
        if (this.settings.updateURL) {
          this.updateHistory(index);
        }
        if (this.settings.smooth && page_index !== index) {
          return this.transformPage(index, function() {
            return _this.moveTo(page_index);
          });
        } else {
          return this.transformPage(index);
        }
      };
      this.updateHistory = function(index) {
        var href;
        if (history.replaceState) {
          href = window.location.href.substr(0, "" + (window.location.href.indexOf('#')) + "#" + index);
          history.pushState({}, document.title, href);
        }
        return this;
      };
      this.bindScrollEvents = function() {
        var _this = this;
        $(document).bind('mousewheel.onepage DOMMouseScroll.onepage', function(e) {
          var delta;
          e.preventDefault();
          delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
          return _this.init_scroll(e, delta);
        });
        return this;
      };
      this.unbindScrollEvents = function() {
        $(document).unbind("mousewheel.onepage DOMMouseScroll.onepage");
        return this;
      };
      this.bindSwipeEvents = function() {
        var hammer,
          _this = this;
        hammer = this.$element.hammer();
        this.$element.hammer().on('swipedown.onepage', function(e) {
          e.preventDefault();
          e.gesture.preventDefault();
          return _this.moveUp();
        }).on('swipeup.onepage', function(e) {
          e.preventDefault();
          e.gesture.preventDefault();
          return _this.moveDown();
        });
        return this;
      };
      this.unbindSwipeEvents = function() {
        var hammer;
        hammer = this.$element.hammer();
        hammer.off('swipedown.onepage');
        hammer.off('swipeup.onepage');
        return this;
      };
      this.bindKeyEvents = function() {
        var _this = this;
        $(document).on('keydown.onepage', function(e) {
          var tag;
          tag = e.target.nodeName;
          if (tag === 'INPUT' || tag === 'TEXTAREA') {
            return;
          }
          switch (e.which) {
            case 33:
            case 38:
              _this.moveUp();
              break;
            case 34:
            case 40:
              _this.moveDown();
              break;
            case 36:
              _this.moveTo(1);
              break;
            case 35:
              _this.moveTo(_this.total);
              break;
            default:
              return;
          }
          return e.preventDefault();
        });
        return this;
      };
      this.unbindKeyEvents = function() {
        $(document).off('keydown.onepage');
        return this;
      };
      this.viewportTooSmall = function() {
        if (this.settings.responsiveFallbackWidth !== false && $(window).width() < this.settings.responsiveFallbackWidth) {
          return true;
        }
        if (this.settings.responsiveFallbackHeight !== false && $(window).height() < this.settings.responsiveFallbackHeight) {
          return true;
        }
        return false;
      };
      this.watchResponsive = function() {
        if (this.viewportTooSmall()) {
          if (this.state === 'created') {
            this.destroy();
          }
        } else {
          if (this.state !== 'created') {
            this.create();
          }
        }
        return this;
      };
      this.init_scroll = function(e, delta) {
        var deltaOfInterest, timeNow;
        deltaOfInterest = delta;
        timeNow = new Date().getTime();
        if (timeNow - this.lastAnimation < this.quietPeriod + this.settings.animationTime) {
          e.preventDefault();
          return;
        }
        if (deltaOfInterest < 0) {
          this.moveDown();
        } else {
          this.moveUp();
        }
        this.lastAnimation = timeNow;
        return this;
      };
      this.bindPagination = function() {
        var _this = this;
        $(".onepage-pagination").on('click.onepage', "li a", function(e) {
          var page_index;
          page_index = $(e.currentTarget).data("index");
          return _this.moveTo(page_index);
        });
        return this;
      };
      this.createSections = function() {
        var topPos,
          _this = this;
        topPos = 0;
        return $.each(this.sections, function(i, elem) {
          $(elem).addClass("section").attr("data-index", i + 1).css({
            position: "absolute",
            top: "" + topPos + "%"
          });
          topPos += 100;
          if (_this.settings.pagination) {
            return _this.paginationList += "<li><a data-index='" + (i + 1) + "' href='#" + (i + 1) + "'></a></li>";
          }
        });
      };
      this.destroySections = function() {
        return this.sections.removeClass("section active").removeAttr("data-index style");
      };
      this.destroy = function() {
        if (this.state === 'created') {
          this.settings.beforeDestroy();
          $('html, body').removeClass('onepage-scroll-enabled');
          $('body').stripClass("viewing-page-");
          this.$element.removeClass("onepage-wrapper").removeAttr("style");
          this.destroySections();
          if (this.settings.pagination) {
            $("ul.onepage-pagination").off('click.onepage', "li a");
            $("ul.onepage-pagination").remove();
          }
          if (this.settings.keyboard) {
            this.unbindKeyEvents();
          }
          this.unbindSwipeEvents();
          this.unbindScrollEvents();
          this.state = 'destroyed';
          this.settings.afterDestroy();
        }
        return this;
      };
      this.create = function() {
        var init_index, posTop;
        if (this.state !== 'created') {
          if (this.viewportTooSmall()) {
            return;
          }
          this.settings.beforeCreate();
          this.sections = $(this.settings.sectionContainer);
          this.total = this.sections.length;
          this.lastAnimation = 0;
          this.paginationList = "";
          $('html, body').addClass('onepage-scroll-enabled');
          this.$element.addClass("onepage-wrapper").css("position", "relative");
          this.createSections();
          if (this.settings.pagination) {
            $("<ul class='onepage-pagination'>" + this.paginationList + "</ul>").prependTo("body");
            posTop = (this.$element.find(".onepage-pagination").height() / 2) * -1;
            this.$element.find(".onepage-pagination").css("margin-top", posTop);
            this.bindPagination();
          }
          this.reset();
          if (window.location.hash !== "" && window.location.hash !== "#1") {
            init_index = window.location.hash.replace("#", "");
            this.moveTo(init_index);
          }
          this.bindSwipeEvents();
          this.bindScrollEvents();
          if (this.settings.keyboard) {
            this.bindKeyEvents();
          }
          this.state = 'created';
          this.settings.afterCreate();
        }
        return this;
      };
      this.reset = function() {
        $("" + this.settings.sectionContainer + "[data-index='1']").addClass("active");
        $("body").addClass("viewing-page-1");
        if (this.settings.pagination) {
          $(".onepage-pagination li a[data-index='1']").addClass("active");
        }
        return $(window).scrollTop(0);
      };
      this.init = function() {
        var _this = this;
        this.settings = $.extend({}, this.defaults, options);
        if (this.settings.responsiveFallbackWidth !== false || this.settings.responsiveFallbackHeight !== false) {
          $(window).on('resize.onepage', function() {
            return _this.watchResponsive();
          });
        }
        this.create();
        return this;
      };
      this.init();
      return this;
    };
    $.onepage_scroll.prototype.defaults = {
      sectionContainer: "section",
      easing: "ease",
      animationTime: 1000,
      pagination: true,
      keyboard: false,
      updateURL: false,
      beforeMove: $.noop,
      afterMove: $.noop,
      loop: false,
      responsiveFallbackWidth: false,
      responsiveFallbackHeight: false,
      smooth: false,
      beforeCreate: $.noop,
      afterCreate: $.noop,
      beforeDestroy: $.noop,
      afterDestroy: $.noop
    };
    return $.fn.onepage_scroll = function(options) {
      this.each(function() {
        var plugin;
        if ($(this).data('onepage_scroll') === void 0) {
          plugin = new $.onepage_scroll(this, options);
          return $(this).data('onepage_scroll', plugin);
        }
      });
      if (this.length === 1 && $(this).data('onepage_scroll') !== void 0) {
        return $(this).data('onepage_scroll');
      }
    };
  });

}).call(this);
