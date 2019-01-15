/*******************************************************************************
 * Copyright 2017 Adobe Systems Incorporated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
;(function(CQ) {
    CQ.WCM = CQ.WCM || {};
    CQ.WCM.Image = CQ.WCM.Image || function() {
            var self = {};
            var CONST = {
                MAP_SELECTOR: ".cq-wcm-foundation-image-map"
            };

            self.handleResize = function() {
                var elements = document.querySelectorAll(CONST.MAP_SELECTOR);

                Array.prototype.forEach.call(elements, function(el) {
                    if(!el.getAttribute("usemap")) {
                        return;
                    }
                    var imgSrc = el.getAttribute("src"),
                        onLoadImg = document.createElement("img");

                    onLoadImg.addEventListener("load", function() {
                        var imgWidth = el.getAttribute("width") || el.naturalWidth,
                            imgHeight = el.getAttribute("height") || el.naturalHeight;

                        if(!imgWidth || !imgHeight) {
                            var tempImage = new Image();
                            tempImage.src = imgSrc;
                            if(!imgWidth) {
                                imgWidth = tempImage.width;
                            }
                            if(!imgHeight) {
                                imgHeight = tempImage.height;
                            }
                        }

                        var relWidth = el.offsetWidth / 100,
                            relHeight = el.offsetHeight / 100,
                            map = el.getAttribute("usemap");
                        map = map.replace('#', '');

                        var maps = document.querySelectorAll('map[name="' + map + '"]');
                        Array.prototype.forEach.call(maps, function(mapEl) {
                            var areas = mapEl.querySelectorAll("area");
                            Array.prototype.forEach.call(areas, function(areaEl) {
                                if(!areaEl.dataset.coords) {
                                    areaEl.dataset.coords = areaEl.getAttribute("coords");
                                }

                                var coords = areaEl.dataset.coords.split(','),
                                    relCoords = new Array(coords.length);

                                for(var i = 0; i < coords.length; ++i) {
                                    if(i % 2 == 0) {
                                        relCoords[i] = parseInt(((coords[i] / imgWidth) * 100) * relWidth);
                                    } else {
                                        relCoords[i] = parseInt(((coords[i] / imgHeight) * 100) * relHeight);
                                    }
                                }
                                areaEl.setAttribute("coords", relCoords.toString());
                            });
                        });
                    });
                    onLoadImg.setAttribute("src", imgSrc);
                });
            };

            return self;
        }();

    var addEventListener = window.addEventListener || window.attachEvent,
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
        mutationConfig = {
            attributes: true
        },
        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function () {
                CQ.WCM.Image.handleResize();
            });
        });

    addEventListener("resize", CQ.WCM.Image.handleResize);
    observer.observe(document, mutationConfig);
    CQ.WCM.Image.handleResize();
})(CQ);
/*
* rwdImageMaps jQuery plugin v1.6
*
* Allows image maps to be used in a responsive design by recalculating the area coordinates to match the actual image size on load and window.resize
*
* Copyright (c) 2016 Matt Stow
* https://github.com/stowball/jQuery-rwdImageMaps
* http://mattstow.com
* Licensed under the MIT license
*/
;(function($) {
	$.fn.rwdImageMaps = function() {
		var $img = this;

		var rwdImageMap = function() {
			$img.each(function() {
				if (typeof($(this).attr('usemap')) == 'undefined')
					return;

				var that = this,
					$that = $(that);

				// Since WebKit doesn't know the height until after the image has loaded, perform everything in an onload copy
				$('<img />').on('load', function() {
					var attrW = 'width',
						attrH = 'height',
						w = $that.attr(attrW),
						h = $that.attr(attrH);

					if (!w || !h) {
						var temp = new Image();
						temp.src = $that.attr('src');
						if (!w)
							w = temp.width;
						if (!h)
							h = temp.height;
					}

					var wPercent = $that.width()/100,
						hPercent = $that.height()/100,
						map = $that.attr('usemap').replace('#', ''),
						c = 'coords';

					$('map[name="' + map + '"]').find('area').each(function() {
						var $this = $(this);
						if (!$this.data(c))
							$this.data(c, $this.attr(c));

						var coords = $this.data(c).split(','),
							coordsPercent = new Array(coords.length);

						for (var i = 0; i < coordsPercent.length; ++i) {
							if (i % 2 === 0)
								coordsPercent[i] = parseInt(((coords[i]/w)*100)*wPercent);
							else
								coordsPercent[i] = parseInt(((coords[i]/h)*100)*hPercent);
						}
						$this.attr(c, coordsPercent.toString());
					});
				}).attr('src', $that.attr('src'));
			});
		};
		$(window).resize(rwdImageMap).trigger('resize');

		return this;
	};
})(jQuery);

/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
;(function(document, $) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
        mutationConfig = { attributes: true },
        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function () {
                bindPlugin();
            });
        });

    $(function() {
        bindPlugin();
        observer.observe(document.documentElement, mutationConfig);
    });

    function bindPlugin() {
        $("div[id^='cq-image-jsp-']").each(function(i, el) {
            $('img[usemap]', el).rwdImageMaps();
        });
    }
})
(document, $CQ);
/*
 * Copyright 1997-2010 Day Management AG
 * Barfuesserplatz 6, 4001 Basel, Switzerland
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Day Management AG, ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Day.
 */
(function($) {
    $(function () {
        // Used to output caught errors
        function errorLog(error, message) {
            try {
                if ($.cq.isAuthor() || window.location.hash == '#debug') {
                    if (typeof console != 'undefined' && typeof console.log  != 'undefined') {
                        console.log(error);
                        console.log(message);
                    }
                    alert(error.name+':\n'+error.message+'.\n'+message+'.');
                }
            } catch (e) { }
        }

        try {
            // Opacity fading conflicts in IE8 with the PNG fix and text anti-aliasing
            var fadingSpeed = $.browser.msie ? 0 : 250;

            // Removes the URL hash if it corresponds to the id of an element in the given context
            function removeHash(context) {
                try {
                    if (window.location.hash.length > 0 && $(window.location.hash, context).length > 0) {
                        window.location = (window.location+'').replace(window.location.hash, '');
                    }
                } catch (e) {
                    errorLog(e, 'Could not remove hash');
                }
            }

            // carousel code
            try {
                $('.cq-carousel').each(function () {
                    var carousel = $(this);
                    var playDelay = +$("var[title='play-delay']", this).text();
                    if (!playDelay) {
                        playDelay = 6000;
                    }
                    var slidingSpeed = +$("var[title='transition-time']", this).text();
                    if (!slidingSpeed) {
                        slidingSpeed = 1000;
                    }
                    var banners = $('.cq-carousel-banners', this);
                    //do not why, but
                    // var links = $('.cq-carousel-banner-switch a', this);
                    //returns more links than expected after component reload. Changed to "find" = works......
                    var switcher = $('.cq-carousel-banner-switch', this);
                    var links = switcher.find('a');
                    var items = $('.cq-carousel-banner-item', this);
                    var width = items.outerWidth();
                    var itemActive = items.filter(':first');
                    var itemPrevious = null;
                    var interval = null;
                    var i = 0;

                    var ctlPrev = $('a.cq-carousel-control-prev', this);
                    ctlPrev.click(function() {
                        if (ctlPrev.is('.cq-carousel-active')) {
                            $(links[(i+links.length-1)%links.length]).click();
                        }
                        return false;
                    });
                    var ctlNext = $('a.cq-carousel-control-next', this);
                    ctlNext.click(function() {
                        if (ctlNext.is('.cq-carousel-active')) {
                            $(links[(i+1)%links.length]).click();
                        }
                        return false;
                    });
                    if (links.length > 1) {
                        ctlNext.addClass('cq-carousel-active');
                    }
                    function play() {
                        stop();
                        if( playDelay > 0) {
                            interval = setInterval(function () {
                                $(links[(i+1)%links.length]).click();
                            }, playDelay);
                        }
                    }
                    function stop() {
                        if (interval !== null) {
                            clearInterval(interval);
                            interval = null;
                        }
                    }

                    // Show first item (needed for browsers that don't support CSS3 selector :first-of-type)
                    if (fadingSpeed || $.browser.version > 6) {
                        itemActive.css('left', 0);
                    } else {
                        itemActive.show();
                    }

                    links
                        .click(function () {
                            var link = $(this);
                            var itemNew = items.filter(link.attr('href'));
                            var j = itemNew.prevAll().length;
                            var direction = (j > i || interval !== null) ? 1 : -1;

                            if (!link.is('.cq-carousel-active')) {
                                links.removeClass('cq-carousel-active');
                                link.addClass('cq-carousel-active');

                                if (itemActive.is(':animated')) {
                                    itemActive.stop(true, true);
                                    itemPrevious.stop(true, true);
                                }

                                if (fadingSpeed) {
                                    itemNew.css({'left': direction*width}).animate({'left': 0, 'opacity': 1}, slidingSpeed);
                                    itemActive.animate({'left': -direction*width, 'opacity': 0}, slidingSpeed);
                                } else if ($.browser.version > 6) {
                                    itemNew.css({'left': direction*width, opacity: 1}).animate({'left': 0}, slidingSpeed);
                                    itemActive.animate({'left': -direction*width}, slidingSpeed);
                                } else {
                                    itemNew.fadeIn();
                                    itemActive.fadeOut();
                                }

                                itemPrevious = itemActive;
                                itemActive = itemNew;
                                i = j;
                                if (i > 0) {
                                    ctlPrev.addClass('cq-carousel-active');
                                } else {
                                    ctlPrev.removeClass('cq-carousel-active');
                                }
                                if (i < links.length-1) {
                                    ctlNext.addClass('cq-carousel-active');
                                } else {
                                    ctlNext.removeClass('cq-carousel-active');
                                }
                            }

                            return false;
                        })
                        .each(function () {
                            var link = $(this);

                            link.attr('title', link.text());
                        })
                        .filter(':first').addClass('cq-carousel-active');

                    play();
                    carousel.hover(
                            function() {
                                stop();
                                ctlPrev.fadeIn();
                                ctlNext.fadeIn();
                            },
                            function() {
                                play();
                                ctlPrev.fadeOut();
                                ctlNext.fadeOut();
                            }
                    );

                    // Accessing the page with the anchor of a banner in the URL can break the layout
                    removeHash(this);
                });
            } catch (e) {
                errorLog(e, 'Could not initialize the banners');
            }
        } catch (e) {
            errorLog(e, 'Init failed');
        }
    });
})($CQ || $);
/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize
 *
 * Copyright 2012 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work? 
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 */
(function($) {

var $event = $.event,
	$special,
	resizeTimeout;

$special = $event.special.debouncedresize = {
	setup: function() {
		$( this ).on( "resize", $special.handler );
	},
	teardown: function() {
		$( this ).off( "resize", $special.handler );
	},
	handler: function( event, execAsap ) {
		// Save the context
		var context = this,
			args = arguments,
			dispatch = function() {
				// set correct event type
				event.type = "debouncedresize";
				$event.dispatch.apply( context, args );
			};

		if ( resizeTimeout ) {
			clearTimeout( resizeTimeout );
		}

		execAsap ?
			dispatch() :
			resizeTimeout = setTimeout( dispatch, $special.threshold );
	},
	threshold: 150
};

})($CQ);
/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */

window.matchMedia = window.matchMedia || (function( doc, undefined ) {

  "use strict";

  var bool,
      docElem = doc.documentElement,
      refNode = docElem.firstElementChild || docElem.firstChild,
      // fakeBody required for <FF4 when executed in <head>
      fakeBody = doc.createElement( "body" ),
      div = doc.createElement( "div" );

  div.id = "mq-test-1";
  div.style.cssText = "position:absolute;top:-100em";
  fakeBody.style.background = "none";
  fakeBody.appendChild(div);

  return function(q){

    div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

    docElem.insertBefore( fakeBody, refNode );
    bool = div.offsetWidth === 42;
    docElem.removeChild( fakeBody );

    return {
      matches: bool,
      media: q
    };

  };

}( document ));
/*
 * Adobe Systems Incorporated
 * Modified: October 30th, 2012
 *
 * Picturefill - Responsive Images that work today. (and mimic the proposed Picture element with divs).
 * Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2
 */

(function ($, w) {

    // Enable strict mode
    "use strict";

    w.picturefill = function (context) {
        var undefined;
        if (context === undefined) {
            context = $("body");
        }

        $("div[data-picture]", context).each(function () {
            var currentPicture = this;
            var matches = [];
            $("div[data-media]", currentPicture).each(function () {
                var media = $(this).attr("data-media");
                if (!media || ( w.matchMedia && w.matchMedia(media).matches )) {
                    matches.push(this);
                }
            });

            var $picImg = $("img", currentPicture).first();

            if (matches.length) {
                if ($picImg.size() === 0) {
                    var $currentPicture = $(currentPicture);
                    $picImg = $("<img />").attr("alt", $currentPicture.attr("data-alt")).appendTo($currentPicture);
                }
                $picImg.attr("src", matches.pop().getAttribute("data-src"));
            } else {
                $picImg.remove();
            }
        });
    };

    // Run on debounced resize and domready
    $(function () {
        w.picturefill();
    });

    $(w).on("debouncedresize", function () {
        w.picturefill();
    });

}($CQ, this));
/*
 * Copyright 1997-2010 Day Management AG
 * Barfuesserplatz 6, 4001 Basel, Switzerland
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Day Management AG, ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Day.
 */
/**
 * Utility functions for forms components.
 */
function cq5forms_isArray(obj) {
    if (Array.isArray) {
        return Array.isArray(obj);
    } else {
        //polyfill
    return Object.prototype.toString.call(obj) === '[object Array]';
}
}

function cq5forms_isNodeList(obj) {
    var prototypeName = Object.prototype.toString.call(obj);

    return typeof obj === 'object' &&
        /^\[object (HTMLCollection|NodeList|RadioNodeList)\]$/.test(prototypeName) &&
        (typeof obj.length === 'number') &&
        (obj.length === 0 || (typeof obj[0] === "object" && obj[0].nodeType > 0));
}

function cq5forms_showMsg(fid, field, msg, index) {
    var f = document.forms[fid].elements[field];
    alert(msg);
    if(cq5forms_isNodeList(f)) {
        f = Array.prototype.slice.call(f);
    }
    if ( cq5forms_isArray(f) ) {
    	if ( !index) index = 0;
    	f[index].focus();
    } else {
    	f.focus()
    }
}
function cq5forms_isEmpty(obj) {
    if (obj === undefined) {
        // don't trigger validation messages on hidden fields (as in show/hide, not type=hidden)
        return false;
    }
    var empty = true;
    if(cq5forms_isNodeList(obj)) {
        obj = Array.prototype.slice.call(obj);
    }
    if ( cq5forms_isArray(obj)) {
        for(i=0;i<obj.length;i++) {
            if (obj[i].type == "radio" || obj[i].type == "checkbox" ) {
                if (obj[i].checked) {empty = false;}
            } else if (obj[i].localName == "option") {
                if (obj[i].selected) {empty = false;}
            } else {
                if (obj[i].value.length>0) { empty = false;}
            }
        }
    } else {
        if (obj.type == "radio" || obj.type == "checkbox" ) {
            if (obj.checked) {empty = false;}
        } else {
            if (obj.value.length>0) { empty = false;}
        }
    }
    return empty;
}
function cq5forms_regcheck(obj, pattern) {
    var result=false;
    var t = pattern.exec(obj);
    if (t) {
        var len = obj.length;
        var pattlen = t[0].length;
        result = (pattlen == len);
    }
    return result;
}

/**
 * Check the MultiResource checkbox if the value of the according field changes.
 * @param {Event} evt The event
 * @param {String} name The name of the mr checkbox
 * @param {boolean} force Force to check the mr checkbox
 */
function cq5forms_multiResourceChange(evt, name, force) {
    if (!force) {
        if (!evt) evt = window.event;
        if (evt.keyCode < 48 && evt.keyCode != 8 && evt.keyCode != 46) {
            //skip control keys, allow backspace and delete
            return;
        }
    }
    try {
        document.getElementById(name).checked = true;
    }
    catch (e) {}
}

