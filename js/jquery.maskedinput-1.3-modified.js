/*
	Masked Input plugin for jQuery
	Copyright (c) 2007-2011 Josh Bush (digitalbush.com)
	Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license) 
	Version: 1.3
*/
/*
	Modified
	Can be valid when not all symbols are inputed using bAllSimbols param
*/
(function($) {
	var pasteEventName = ($.browser.msie ? 'paste' : 'input') + ".mask";
	var iPhone = (window.orientation != undefined);

	$.mask = {
		//Predefined character definitions
		definitions: {
			'9': "[0-9]",
			'a': "[-A-Za-z ]",
            'а': "[-А-Яа-я ]",
			'*': "[A-Za-z0-9]"
		},
		dataName:"rawMaskFn"
	};

	$.fn.extend({
		//Helper Function for Caret positioning
		caret: function(begin, end) {
			if (this.length == 0) return;
			if (typeof begin == 'number') {
				end = (typeof end == 'number') ? end : begin;
				return this.each(function() {
					if (this.setSelectionRange) {
						this.setSelectionRange(begin, end);
					} else if (this.createTextRange) {
						var range = this.createTextRange();
						range.collapse(true);
						range.moveEnd('character', end);
						range.moveStart('character', begin);
						range.select();
					}
				});
			} else {
				if (this[0].setSelectionRange) {
					begin = this[0].selectionStart;
					end = this[0].selectionEnd;
				} else if (document.selection && document.selection.createRange) {
					var range = document.selection.createRange();
					begin = 0 - range.duplicate().moveStart('character', -100000);
					end = begin + range.text.length;
				}
				return { begin: begin, end: end };
			}
		},
		unmask: function() { return this.trigger("unmask"); },
        isMaskValid: function(){
            return $(this).data('mask-isvalid');
        },
		mask: function(mask, settings) {
			if (!mask && this.length > 0) {
				var input = $(this[0]);
				return input.data($.mask.dataName)();
			}
			settings = $.extend({
				placeholder: "_",
				completed: null,
                changed: null,
                bAllSimbols: true
			}, settings);

			var defs = $.mask.definitions;
			var tests = [];
			var partialPosition = mask.length;
			var firstNonMaskPos = null;
			var len = mask.length;

            if (settings.placeholder.length == 1) {
                for (var i = 0; i < mask.length; ++i) {
                    settings.placeholder += settings.placeholder.charAt(0);
                }
            }

			$.each(mask.split(""), function(i, c) {
				if (c == '?') {
					len--;
					partialPosition = i;
				} else if (defs[c]) {
					tests.push(new RegExp(defs[c]));
					if(firstNonMaskPos==null)
						firstNonMaskPos =  tests.length - 1;
				} else {
					tests.push(null);
				}
			});

			return this.trigger("unmask").each(function() {
				var input = $(this);
				var buffer = $.map(mask.split(""), function(c, i) { if (c != '?')
                    return defs[c] ? settings.placeholder.charAt(i) : c });
				var focusText = input.val();

				function seekNext(pos) {
					while (++pos <= len && !tests[pos]);
					return pos;
				};
				function seekPrev(pos) {
					while (--pos >= 0 && !tests[pos]);
					return pos;
				};

				function shiftL(begin,end) {
					if(begin < 0)
					   return;
					for (var i = begin, j = seekNext(end); i < len; i++) {
						if (tests[i]) {
							if (j < len && tests[i].test(buffer[j])) {
								buffer[i] = buffer[j];
								buffer[j] = settings.placeholder.charAt(j);
							} else
								break;
							j = seekNext(j);
						}
					}
					writeBuffer();
					input.caret(Math.max(firstNonMaskPos, begin));
				};

				function shiftR(pos) {
					for (var i = pos, c = settings.placeholder.charAt(0); i < len; i++) {
						if (tests[i]) {
							var j = seekNext(i);
							var t = buffer[i];
							buffer[i] = c;
							if (j < len && tests[j].test(t))
								c = t;
							else
								break;
						}
					}
				};

				function keydownEvent(e) {
					var k=e.which;

					//backspace, delete, and escape get special treatment
					if(k == 8 || k == 46 || (iPhone && k == 127)){
						var pos = input.caret(),
							begin = pos.begin,F
							end = pos.end;
						
						if(end-begin==0){
							begin=k!=46?seekPrev(begin):(end=seekNext(begin-1));
							end=k==46?seekNext(end):end;
						}
						clearBuffer(begin, end);
						shiftL(begin,end-1);
                        isValid();                      //twarogowski

                        if (settings.changed) {
                            settings.changed.call(input);
                        }

						return false;
					} else if (k == 27) {//escape
						input.val(focusText);
						input.caret(0, checkVal(! settings.bAllSimbols));
						return false;
					}
				};


                function _hasMaskIntersect(placeholder, val, mask) {
                    for(var i = 0; i < placeholder.length; i++){
                        for(var k = 0; k < val.length; k++){
                            if(placeholder[i] == val[k] && val[i] != mask[i]){
                                return true;
                            }
                        }
                    }
                    return false;
                }

				function keypressEvent(e) {
					var k = e.which,
						pos = input.caret();

					if (e.ctrlKey || e.altKey || e.metaKey || k < 32) {//Ignore
						return true;
					} else if (k) {
						if(pos.end-pos.begin!=0){
							clearBuffer(pos.begin, pos.end);
							shiftL(pos.begin, pos.end-1);
                            isValid();                      //twarogowski
						}

						var p = seekNext(pos.begin - 1);
						if (p < len) {

                            if (settings.changed) {
                                settings.changed.call(input);
                            }

							var c = String.fromCharCode(k);
							if (tests[p].test(c)) {
								shiftR(p);
								buffer[p] = c;
								writeBuffer();
								var next = seekNext(p);
								input.caret(next);
                                isValid();                      //twarogowski
								if (settings.completed) {
                                    if (next >= len)
									    settings.completed.call(input);

                                    //I think if there is no placeholders in input so we need to call completed callback too.
                                    else if (!_hasMaskIntersect(settings.placeholder.split(""),
                                        input.val().split(""), mask.split(""))) {
                                            settings.completed.call(input);
                                    }
                            }



							}
						}
						return false;
					}
				};

				function clearBuffer(start, end) {
					for (var i = start; i < end && i < len; i++) {
						if (tests[i])
							buffer[i] = settings.placeholder.charAt(i);
					}
				};

				function writeBuffer() { return input.val(buffer.join('')).val(); };

                function isValid(){
                    var test = input.val();
                    var lastMatch = -1;
                    for (var i = 0, pos = 0; i < len; i++) {
                        if (tests[i]) {
                            buffer[i] = settings.placeholder[i];
                            while (pos++ < test.length) {
                                var c = test.charAt(pos - 1);
                                if (tests[i].test(c) || (!settings.bAllSimbols && c == settings.placeholder[pos - 1]) ) {
                                    buffer[i] = c;
                                    lastMatch = i;
                                    break;
                                }
                            }
                            if (pos > test.length)
                                break;
                        } else if (buffer[i] == test.charAt(pos) && i != partialPosition) {
                            pos++;
                            lastMatch = i;
                        }
                    }

                    var valid = (lastMatch + 1 >= partialPosition);
                    input.data('mask-isvalid', valid);
                    return valid;
                }

				function checkVal(allow) {
					//try to place characters where they belong
					var test = input.val();

                    if (test.indexOf('м') >= 0)
                    {
                        var z = 0;
                    }

					var lastMatch = -1;
					for (var i = 0, pos = 0; i < len; i++) {
						if (tests[i]) {
							buffer[i] = settings.placeholder.charAt(i);
							while (pos++ < test.length) {
								var c = test.charAt(pos - 1);
								if (tests[i].test(c)) {
									buffer[i] = c;
                                    if (pos - 1 != i)
                                        buffer[pos - 1] = settings.placeholder.charAt(pos - 1);

									lastMatch = i;
									break;
								}
							}
							if (pos > test.length)
								break;
						} else if (buffer[i] == test.charAt(pos) && i!=partialPosition) {
							pos++;
							lastMatch = i;
						}
					}
					if (!allow && lastMatch + 1 < partialPosition) {
						input.val("");
						clearBuffer(0, len);
					} else if (allow || lastMatch + 1 >= partialPosition) {
						writeBuffer();
						if (!allow) input.val(input.val().substring(0, lastMatch + 1));
					}
					return (partialPosition ? i : firstNonMaskPos);
				};

				input.data($.mask.dataName,function(){
					return $.map(buffer, function(c, i) {
						return tests[i] && c != settings.placeholder.charAt(i) ? c : null;
					}).join('');
				})

				if (!input.attr("readonly"))
					input
					.one("unmask", function() {
						input
							.unbind(".mask")
							.removeData($.mask.dataName);
					})
					.bind("focus.mask", function() {
						focusText = input.val();
						var pos = checkVal(! settings.bAllSimbols);
						writeBuffer();
						var moveCaret=function(){
							if (pos == mask.length)
								input.caret(0, pos);
							else
								input.caret(pos);
						};
						($.browser.msie ? moveCaret:function(){setTimeout(moveCaret,0)})();
					})
					.bind("blur.mask", function() {
						checkVal(! settings.bAllSimbols);
						if (input.val() != focusText)
							input.change();
					})
					.bind("keydown.mask", keydownEvent)
					.bind("keypress.mask", keypressEvent)
					.bind(pasteEventName, function() {
						setTimeout(function() { input.caret(checkVal(true)); }, 0);
					});

				checkVal(! settings.bAllSimbols); //Perform initial check for existing values
			});
		}
	});
})(jQuery);
