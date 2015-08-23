angular.module("RecursionHelperModule", [])
	.factory('RecursionHelper', ['$compile', function($compile) {
		return {
			/**
			 * Manually compiles the element, fixing the recursion loop.
			 * @param element
			 * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
			 * @returns An object containing the linking functions.
			 */
			compile: function(element, link){
				// Normalize the link parameter
				if(angular.isFunction(link)){
					link = { post: link };
				}

				// Break the recursion loop by removing the contents
				var contents = element.contents().remove();
				var compiledContents;
				return {
					pre: (link && link.pre) ? link.pre : null,
					/**
					 * Compiles and re-adds the contents
					 */
					post: function(scope, element){
						// Compile the contents
						if(!compiledContents){
							compiledContents = $compile(contents);
						}
						// Re-add the compiled contents to the element
						compiledContents(scope, function(clone){
							element.append(clone);
						});

						// Call the post-linking function, if any
						if(link && link.post){
							link.post.apply(null, arguments);
						}
					}
				};
			}
    };
}]);


function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }

    return -1;
}

angular.module("AdditionalFormControlsModule", [])
	.directive("fileread", [function () {
		return {
			scope: {
				fileread: "="
			},
			link: function (scope, element, attributes) {
				element.bind("change", function (changeEvent) {
					var reader = new FileReader();
					reader.onload = function (loadEvent) {
						scope.$apply(function () {
							scope.fileread = loadEvent.target.result;
						});
					};
					reader.readAsDataURL(changeEvent.target.files[0]);
				});
			}
		}
	}])
	.directive("uiDurationEdit", function() {
		return {
			restrict: 'E',
			replace: true,
			template:
				'<div class="row">' +
					'<label class="col-sm-1 control-label">часов</label>' +
					'<div class="col-sm-2" style="padding-left: 0">' +
						'<input type="number" class="form-control" ng-model="hours" ng-change="onChange()">' +
					'</div>' +
					'<label class="col-sm-1 control-label">минут</label>' +
					'<div class="col-sm-2" style="padding-left: 0">' +
						'<input type="number" class="form-control" ng-model="minutes" ng-change="onChange()">' +
					'</div>' +
					'<label class="col-sm-1 control-label">секунд</label>' +
					'<div class="col-sm-2" style="padding-left: 0">' +
						'<input type="number" class="form-control" ng-model="seconds" ng-change="onChange()">' +
					'</div>' +
				'</div>',
			require: 'ngModel',
			scope: {
				total_seconds: '=ngModel'
			},
			link: function(scope, element, attrs, controller) {
				var secondsRest = scope.total_seconds || 0;
				scope.hours = secondsRest / 3600 | 0;
				var secondsRest = secondsRest - scope.hours * 3600;
				scope.minutes = secondsRest / 60 | 0;
				secondsRest = secondsRest - scope.minutes * 60;
				scope.seconds = secondsRest;

				scope.onChange = function() {
					var seconds = scope.seconds + scope.minutes * 60 + scope.hours * 3600;
					scope.total_seconds = seconds;
				}
			}
		};
	})
	.directive("uiMultipleTableSelect", function() {
		return {
			restrict: 'E',
			replace: true,
			template:
				 '<div>' +
					'<button type="button" class="btn btn-default" ng-click="expanded = !expanded">' +
						'{{ selectedNames() }}' +
						'<span class=caret style="margin: 0 0 1px 12px !important"></span>' +
					'</button>' +
					'<div ng-show="expanded">' +
						'<br><br>' +
						'<table class="table table-striped table-condensed">' +
							'<th class="col-md-1"></th>' +
							'<th ng-repeat="column in columns" ng-class="column.class">{{ column.header }}</th>' +
							'<tr ng-repeat="object in inputModel">' +
								'<td>' +
									'<input type="checkbox" ng-checked="isSelected(object)"' +
										'ng-click="toggleSelected(object)">' +
								'</td>' +
								'<td ng-repeat="column in columns"> {{ object[column.name] }}' +
								'</td>' +
							'</tr>' +
						'</table>' +
					 '</div>' +
				'</div>',
			require: 'ngModel',
			scope: {
				selected: '=ngModel',
				inputModel: '=',
				valueField: '@',
				nameField: '@'
			},
			controller: ['$scope', '$element', '$attrs',
				function ($scope, $element, $attrs) {
					$scope.columns = angular.fromJson($attrs.columns);
					var maxLabels = $attrs.maxLabels || 10;

					if (!$scope.selected) {
						$scope.selected = [];
					}

					$scope.$watch('inputModel', function(newValues) {
					   if (!newValues) {
						   $scope.selected = [];
					   } else {
						   var valuesToRemove = [];
						   for (var i in $scope.selected) {
								if (findWithAttr(newValues, $scope.valueField, $scope.selected[i]) == -1) {
									valuesToRemove.push($scope.selected[i]);
								}
						   }

						   for (var i in valuesToRemove) {
							   $scope.selected.splice($scope.selected.indexOf(valuesToRemove[i]), 1);
						   }
					   }
					});

					$scope.toggleSelected = function(object) {
						if ($scope.selected.indexOf(object[$scope.valueField]) != -1) {
							$scope.selected.splice($scope.selected.indexOf(object[$scope.valueField]), 1);
						} else {
							$scope.selected.push(object[$scope.valueField]);
						}
					};

					$scope.isSelected = function(object) {
						var res = $scope.selected.indexOf(object[$scope.valueField]) != -1;
						return res;
					};

					$scope.selectedNames = function() {
						if (!$scope.selected) {
							$scope.selected = [];
						}

						var result = "";
						if ($scope.selected.length) {
							var filtered = _.filter($scope.inputModel, function(value) {
								return $scope.selected.indexOf(value[$scope.valueField]) != -1;
							});

							var names = _.pluck(filtered, $scope.nameField);
							var slicedNames = names.slice(0, maxLabels);
							result = slicedNames.join(', ');

							if (slicedNames.length < names.length) {
								result += ' (total ' + names.length + ')';
							}

						} else {
							result = 'Not selected';
						}

						var totalLength = $scope.inputModel ? $scope.inputModel.length : 0;
						result += " (" + $scope.selected.length + " from "  + totalLength + ")";

						return result;
					}
				}
			]
		};
	})
	.directive("uiSingleTableSelect", function() {
		return {
			restrict: 'E',
			replace: true,
			template:
				'<div>' +
					'<button type="button" class="btn btn-default" ng-click="expanded = !expanded">' +
						'{{ selectedName() }}' +
						'<span class=caret style="margin: 0 0 1px 12px !important"></span>' +
					'</button>' +
					'<div ng-show="expanded">' +
						'<br><br>' +
						'<table class="table table-striped table-condensed">' +
							'<th class="col-md-1"></th>' +
							'<th ng-repeat="column in columns" ng-class="column.class">{{ column.header }}</th>' +
							'<tr ng-repeat="object in inputModel">' +
								'<td>' +
									'<input type="radio" ng-model="$parent.selected" ng-value="object[valueField]">' +
								'</td>' +
								'<td ng-repeat="column in columns"> {{ object[column.name] }}' +
								'</td>' +
							'</tr>' +
						'</table>' +
					'</div>' +
				'</div>',
			require: 'ngModel',
			scope: {
				selected: '=ngModel',
				inputModel: '=',
				valueField: '@',
				nameField: '@'
			},
			controller: ['$scope', '$element', '$attrs',
				function ($scope, $element, $attrs) {
					$scope.columns = angular.fromJson($attrs.columns);

					$scope.selectedName = function() {
						var result = "";
						if ($scope.selected) {
							var index = findWithAttr($scope.inputModel, $scope.valueField, $scope.selected);
							var obj = $scope.inputModel[index];
							result = obj[$scope.nameField];
						} else {
							result = 'Not selected';
						}

						var totalLength = $scope.inputModel ? $scope.inputModel.length : 0;
						result += " (from "  + totalLength + ")";

						return result;
					};

					$scope.$watch('inputModel', function(newValues) {
					   if (!newValues || findWithAttr(newValues, $scope.valueField, $scope.selected) == -1) {
						   $scope.selected = undefined;
					   }
					});
				}
			]
		};
	});
	

angular.module("AutoFormModule", ['AdditionalFormControlsModule', 'RecursionHelperModule'])
    .directive("uiAutoFormTextParam", function() {
		return {
			restrict: 'E',
			template:
				'<input type="text" class="form-control"' +
					   'ng-model="resultModel[param.name]" name="{{ param.name }}"' +
					   'ng-required="!!param.required"' +
					   'placeholder="{{param.placeholder}}"' +
					   'ui-maxlength="param.max_length"' +
					   'ng-pattern="/{{param.pattern}}/" ' +
				'>',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			},
			link: function(scope, element, attrs, controller) {
				if (scope.param.default !== undefined) {
					scope.resultModel[scope.param.name] = scope.param.default;
				}
			}
		}
	})
    .directive("uiAutoFormPasswordParam", function() {
		return {
			restrict: 'E',
			template:
				'<input type="password" class="form-control"' +
					   'ng-model="resultModel[param.name]" name="{{param.name}}"' +
					   'ng-required="!!param.required"' +
					   'placeholder="{{param.placeholder}}"' +
					   'ui-maxlength="param.max_length">',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			}
		}
	})
	.directive("uiAutoFormNumberParam", function() {
		return {
			restrict: 'E',
			template:
				'<input type="number" class="form-control"' +
					   'ng-model="resultModel[param.name]" name="{{param.name}}"' +
					   'ng-required="!!param.required" min="{{param.min}}" max="{{param.max}}"' +
					   'placeholder="{{param.placeholder}}">',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			},
			link: function(scope, element, attrs, controller) {
				if (scope.param.default !== undefined) {
					scope.resultModel[scope.param.name] = scope.param.default;
				}
			}
		}
	})
	.directive("uiAutoFormChoiceParam", function() {
		return {
			restrict: 'E',
			template:
				'<ui-single-table-select' +
					' ng-model="resultModel[param.name]"' +
					' input-model="param.values"' +
					" columns='[{\"name\": \"name\", \"class\": \"col-md-11\", \"header\": \"Allowed variants\"}]'" +
					' value-field="value" name-field="name" max-labels="4">' +
				'</ui-single-table-select>',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			},
			link: function(scope, element, attrs, controller) {
				if (scope.param.default !== undefined) {
					scope.resultModel[scope.param.name] = scope.param.default;
				}
			}
		}
	})
	.directive("uiAutoFormMultiChoiceParam", function() {
		return {
			restrict: 'E',
			template:
				'<ui-multiple-table-select' +
					' ng-model="resultModel[param.name]"' +
					' input-model="param.values"' +
					" columns='[{\"name\": \"name\", \"class\": \"col-md-11\", \"header\": \"Allowed variants\"}]'" +
					' value-field="value" name-field="name" max-labels="4">' +
				'</ui-multiple-table-select>',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			},
		}
	})
	.directive("uiAutoFormFileParam", function() {
		return {
			restrict: 'E',
			template:
				'<input type="file" fileread="resultModel[param.name]" ' +
					'ng-required="!!param.required" class="form-control"/>',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			}
		}
	})
	.directive("uiAutoFormParamListParam", function(RecursionHelper) {
		return {
			restrict: 'E',
			replace: true,
			template:
				'<table class="table table-striped">' +
					'<th>' +
						'<a class="btn btn-default btn-success" href ng-click="addNewToListParams()">' +
							'<i class="fa fa-plus-circle"></i>' +
						'</a>' +
					'</th>' +
					'<th ng-repeat="inner_param in param.params">{{ inner_param.view_name }}</th>' +
					'<th></th>' +
					'<tr ng-repeat="line in resultModel[param.name]">' +
						'<td></td>' +
						'<td ng-repeat="inner_param in param.params" ng-switch="inner_param.type">' +
							'<div ng-switch-when="text">' +
								'<ui-auto-form-text-param ng-model="line" param="inner_param"></ui-auto-form-text-param>' +
							'</div>' +

							'<div ng-switch-when="password">' +
								'<ui-auto-form-password-param ng-model="line" param="inner_param"></ui-auto-form-password-param>' +
							'</div>' +

							'<div ng-switch-when="number">' +
								'<ui-auto-form-number-param ng-model="line" param="inner_param"></ui-auto-form-number-param>' +
							'</div>' +

							'<div ng-switch-when="choice" >' +
								 '<ui-auto-form-choice-param ng-model="line" param="inner_param"></ui-auto-form-choice-param>' +
							'</div>' +

							'<div ng-switch-when="multichoice">' +
								 '<ui-auto-form-multi-choice-param ng-model="line" param="inner_param"></ui-auto-form-multi-choice-param>' +
							'</div>' +

							'<div ng-switch-when="file">' +
								 '<ui-auto-form-file-param ng-model="line" param="inner_param"></ui-auto-form-file-param>' +
							'</div>' +
							'<div ng-switch-when="params_list">' +
							 '<ui-auto-form-param-list-param ng-model="line" param="inner_param"></ui-auto-form-param-list-param>' +
						'</div>' +
						'</td>' +
						'<td>' +
							'<a href ng-click="removeListParams(line)">' +
								'<i class="fa fa-times" style="color: red; margin-left: 5px;">' +
							'</a>' +
						'</td>' +
					'</tr>' +
				'</table>',

			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			},

			compile: function(element) {
				var link = function(scope, element, attrs, controller) {
					scope.removeListParams = function(line) {
						var arr = scope.resultModel[scope.param.name];
						var index = arr.indexOf(line);
						arr.splice(index, 1);
					};

					scope.addNewToListParams = function() {
						if (! (scope.param.name in scope.resultModel)) {
							scope.resultModel[scope.param.name] = [];
						}
						scope.resultModel[scope.param.name].push({'params': {}});
					};
				};
				// Use the compile function from the RecursionHelper,
				// And return the linking function(s) which it returns
				return RecursionHelper.compile(element, link);
			}
		}
	})
	.directive("uiAutoFormParam", function() {
		return {
			restrict: 'E',
			replace: true,
			template:
					'<div class="col-sm-8" ng-switch="param.type">' +
						'<div ng-switch-when="text" >' +
							'<ui-auto-form-text-param ng-model="resultModel" param="param"></ui-auto-form-text-param>' +
						'</div>' +

						'<div ng-switch-when="password" >' +
							'<ui-auto-form-password-param ng-model="resultModel" param="param"></ui-auto-form-password-param>' +
						'</div>' +

						'<div ng-switch-when="number" >' +
							'<ui-auto-form-number-param ng-model="resultModel" param="param"></ui-auto-form-number-param>' +
						'</div>' +

						'<div ng-switch-when="choice" >' +
							 '<ui-auto-form-choice-param ng-model="resultModel" param="param"></ui-auto-form-choice-param>' +
						'</div>' +

						'<div ng-switch-when="multichoice" >' +
							 '<ui-auto-form-multi-choice-param ng-model="resultModel" param="param"></ui-auto-form-multi-choice-param>' +
						'</div>' +

						'<div ng-switch-when="file" >' +
							 '<ui-auto-form-file-param ng-model="resultModel" param="param"></ui-auto-form-file-param>' +
						'</div>' +

						'<div ng-switch-when="params_list">' +
							 '<ui-auto-form-param-list-param ng-model="resultModel" param="param"></ui-auto-form-param-list-param>' +
						'</div>' +
					'</div>',
			require: 'ngModel',
			scope: {
				resultModel: '=ngModel',
				param: '='
			}
		}
	})
	.directive("uiAutoForm", function() {
    return {
        restrict: 'E',
        replace: true,
        template:
            '<form name="autoForm">' +
                '<div class="form-group">' +
                    '<div class="form-group" ng-repeat="param in settings.params">' +
                        '<label class="col-sm-3 control-label">{{ param.view_name }}</label>' +
                        '<ui-auto-form-param ng-model="resultModel" param="param"></ui-auto-form-param>' +
                    '</div>' +
                '</div>' +

                '<div class="form-group" ng-repeat="param_group in getDependParamsGroups()">' +
                    '<div style="padding-left: 30px">' +
                        '<legend>{{ param_group.group_header }}</legend>' +
                    '</div>' +

                    '<div class="form-group" ng-repeat="param in param_group.params">' +
                        '<label class="col-sm-3 control-label" ng-class="{\'not-required-input-label\': param.required}">' +
                            '{{ param.view_name }}' +
                        '</label>' +
                        '<ui-auto-form-param ng-model="resultModel" param="param"></ui-auto-form-param>' +
                    '</div>' +
                '</div>' +
            '</form>',
        require: 'ngModel',
        scope: {
            resultModel: '=ngModel',
            settings: '=',
        },
        link: function(scope, element, attrs, controller) {

            scope.getDependParamsGroups = function() {
                var result = [];

					for(var i in scope.settings.depend_param_groups) {
						var group = scope.settings.depend_param_groups[i];
						var depend_param_value = scope.resultModel[group.depend_on];

						if (!depend_param_value) {
							continue;
						}

						var depend_value = group.depend_value;

						var depend_param = _.filter(scope.settings.params, function(param) {
							return param.name == group.depend_on;
						})[0];

						var ok = false;
						if (depend_param.type == 'multichoice') {
							if (depend_param_value.indexOf(depend_value) != -1) {
								ok = true;
							}
						} else {
							ok = depend_value == depend_param_value;
						}

						if (ok) {
						   result.push(group);
						}
					}

					return result;
				};
			}
		};
	});