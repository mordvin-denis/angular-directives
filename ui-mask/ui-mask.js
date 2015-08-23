angular.module("MaskDirectiveModule", [])
	/*
     Attaches jquery-ui input mask onto input element
    */
    .directive('uiMask', [ function () {
            return {
                require:'ngModel',
                link:function ($scope, element, attrs, controller) {

                    var value = controller.$viewValue || '';
					element.val(value);

					var mask = attrs.uiMask || ' ';
					var placeholder = attrs.maskPlaceholder || "' '";
					var maskAll = attrs.maskAll || true;

					element.mask($scope.$eval(mask), { placeholder: $scope.$eval(placeholder),
						bAllSimbols: $scope.$eval(maskAll) });

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