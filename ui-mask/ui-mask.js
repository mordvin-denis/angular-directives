angular.module("MaskDirectiveModule", [])
	/*
     Attaches jquery-ui input mask onto input element
    */
    .directive('uiMask', [ function () {
            return {
                require:'ngModel',
                link:function ($scope, element, attrs, controller) {

                    /* We override the render method to run the jQuery mask plugin
                     */
                    controller.$render = function () {
                        var value = controller.$viewValue || '';
                        element.val(value);

                        var mask = attrs.uiMask || ' ';
                        var placeholder = attrs.maskPlaceholder || "' '";
                        var maskAll = attrs.maskAll || true;

                        element.mask($scope.$eval(mask), { placeholder: $scope.$eval(placeholder),
                            bAllSimbols: $scope.$eval(maskAll) });
                    };

                    /* Add a parser that extracts the masked value into the model but only if the mask is valid
                     */
                    controller.$parsers.push(function (value) {
                        //the second check (or) is only needed due to the fact that element.isMaskValid() will keep returning undefined
                        //until there was at least one key event
                        var isValid = element.isMaskValid() || angular.isUndefined(element.isMaskValid()) &&
                            element.val().length > 0;
                        controller.$setValidity('mask', isValid);
                        return isValid ? value : undefined;
                    });

                    /* When keyup, update the view value
                     */
                    element.bind('keyup', function () {
                        $scope.$apply(function () {
                            controller.$setViewValue(element.val());
                        });
                    });
                }
            };
        }
    ])