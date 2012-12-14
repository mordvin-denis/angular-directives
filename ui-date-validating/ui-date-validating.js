angular.module("DateValidationModule", [])
	.directive('uiDateValidating', function (dateFilter) {
        return {
            require:'ngModel',
            link:function (scope, elm, attrs, ctrl) {

                ctrl.$parsers.unshift(function (viewValue) {
                    var dateFormat = attrs['uiDateValidating'] || 'yyyy-MM-dd';
                    var parsedDate = Date.parseExact(elm.val(), dateFormat);
                    if (parsedDate != null) {

						//param 'min' in attrs shoul be Date object or string with date in 'dateFormat' format
                        var minDate = 0;
						if (attrs['min']) {
							minDate = Date.parseExact(attrs['min'], dateFormat);
							if (!minDate) {
								minDate = scope.$eval(attrs['min']);
							}
						}
						
						//param 'min' in attrs shoul be Date object or string with date in 'dateFormat' format
                        var maxDate = 9007199254740992;
						if (attrs['max']) {
							maxDate = Date.parseExact(attrs['max'], dateFormat);
							if (!maxDate) {
								maxDate = scope.$eval(attrs['max']);
							}
						}
						
                        if (parsedDate >= minDate && parsedDate <= maxDate) {
                            ctrl.$setValidity('uiDateValidating', true);
                            return parsedDate;
                        }
                    }

                    // in all other cases it is invalid, return undefined (no model update)
                    ctrl.$setValidity('uiDateValidating', false);
                    return undefined;
                });

                ctrl.$formatters.unshift(function (modelValue) {
                    var dateFormat = attrs['uiDateValidating'] || 'yyyy-MM-dd';
                    ctrl.$setValidity('uiDateValidating', true);
                    return dateFilter(modelValue, dateFormat);
                });
            }
        };
    })