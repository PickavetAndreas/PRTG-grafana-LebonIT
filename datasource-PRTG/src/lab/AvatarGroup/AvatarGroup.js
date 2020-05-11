"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.styles = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var React = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactIs = require("react-is");

var _clsx = _interopRequireDefault(require("clsx"));

var _styles = require("@material-ui/core/styles");

var _Avatar = _interopRequireDefault(require("@material-ui/core/Avatar"));

var SPACINGS = {
  small: -16,
  medium: null
};

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      display: 'flex'
    },

    /* Styles applied to the avatar elements. */
    avatar: {
      border: "2px solid ".concat(theme.palette.background.default),
      marginLeft: -8
    }
  };
};

exports.styles = styles;
var AvatarGroup = React.forwardRef(function AvatarGroup(props, ref) {
  var childrenProp = props.children,
      classes = props.classes,
      className = props.className,
      _props$spacing = props.spacing,
      spacing = _props$spacing === void 0 ? 'medium' : _props$spacing,
      _props$max = props.max,
      max = _props$max === void 0 ? 5 : _props$max,
      other = (0, _objectWithoutProperties2.default)(props, ["children", "classes", "className", "spacing", "max"]);
  var children = React.Children.toArray(childrenProp).filter(function (child) {
    if (process.env.NODE_ENV !== 'production') {
      if ((0, _reactIs.isFragment)(child)) {
        console.error(["Material-UI: the AvatarGroup component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n'));
      }
    }

    return React.isValidElement(child);
  });
  var extraAvatars = children.length > max ? children.length - max : 0;
  return /*#__PURE__*/React.createElement("div", (0, _extends2.default)({
    className: (0, _clsx.default)(classes.root, className),
    ref: ref
  }, other), children.slice(0, children.length - extraAvatars).map(function (child, index) {
    return React.cloneElement(child, {
      className: (0, _clsx.default)(child.props.className, classes.avatar),
      style: (0, _extends2.default)({
        zIndex: children.length - index,
        marginLeft: spacing && SPACINGS[spacing] !== undefined ? SPACINGS[spacing] : -spacing
      }, child.props.style)
    });
  }), extraAvatars ? /*#__PURE__*/React.createElement(_Avatar.default, {
    className: classes.avatar,
    style: {
      zIndex: 0,
      marginLeft: spacing && SPACINGS[spacing] !== undefined ? SPACINGS[spacing] : -spacing
    }
  }, "+", extraAvatars) : null);
});
process.env.NODE_ENV !== "production" ? AvatarGroup.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // |     To update them edit the d.ts file and run "yarn proptypes"     |
  // ----------------------------------------------------------------------

  /**
   * The avatars to stack.
   */
  children: _propTypes.default.node,

  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css) below for more details.
   */
  classes: _propTypes.default.object,

  /**
   * @ignore
   */
  className: _propTypes.default.string,

  /**
   * Max avatars to show before +x.
   */
  max: _propTypes.default.number,

  /**
   * Spacing between avatars.
   */
  spacing: _propTypes.default.oneOfType([_propTypes.default.oneOf(['medium', 'small']), _propTypes.default.number])
} : void 0;

var _default = (0, _styles.withStyles)(styles, {
  name: 'MuiAvatarGroup'
})(AvatarGroup);

exports.default = _default;