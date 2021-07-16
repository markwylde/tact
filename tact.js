const scopes = {
  current: null
};

function shallowCompareArrays (a, b) {
  a = Array.isArray(a) ? a : [];
  b = Array.isArray(b) ? b : [];
  return a.length === b.length && a.every(
    (item, index) => item === b[index]
  );
}

export function useState (initialState) {
  const scope = scopes.current;
  scope.hookId = scope.hookId + 1;
  const hookId = scope.hookId;

  scope.states[hookId] = scope.states[hookId] || initialState;

  const setState = functionOrValue => {
    scope.states[hookId] = functionOrValue instanceof Function ? functionOrValue(scope.states[hookId]) : functionOrValue;
    scope.redraw();
  };
  return [scope.states[hookId], setState];
}

export function useEffect (runner, dependencies) {
  const scope = scopes.current;
  scope.hookId = scope.hookId + 1;

  const previousEffect = scope.effects[scope.hookId];

  scope.effects[scope.hookId] = {
    ...previousEffect,
    active: true,
    previousDependencies: previousEffect && previousEffect.dependencies,
    dependencies,
    runner
  };
}

export function createComponent (tag, attributes, ...children) {
  const scope = {};
  return {
    tag,
    attributes,
    children,
    scope
  };
}

function buildComponent (parent, tree) {
  const scope = {
    states: {},
    effects: {}
  };
  scopes.current = scope;

  scope.redraw = () => {
    scope.hookId = 0;
    scopes.current = scope;
    const built = tree.tag();

    if (scope.element) {
      scope.element.parentNode.removeChild(scope.element);
    }

    scope.element = render(built, parent);
    parent.appendChild(scope.element);

    Object.keys(scope.effects)
      .forEach(hookId => {
        const effect = scope.effects[hookId];

        const changed = !effect.dependencies || !shallowCompareArrays(effect.previousDependencies, effect.dependencies);
        if (changed) {
          effect.cleaner && effect.cleaner();
          effect.cleaner = effect.runner();
        }
      });
  };

  scope.redraw();

  scopes.current = null;
}

function buildElement (parent, tree) {
  const element = document.createElement(tree.tag);
  Object.assign(element, tree.attributes);

  tree.children.forEach(child => {
    render(child, element);
  });

  parent.appendChild(element);

  return element;
}

export function render (tree, parent) {
  if (tree.tag instanceof Function) {
    return buildComponent(parent, tree);
  }

  if (tree.tag) {
    return buildElement(parent, tree);
  }

  const element = document.createTextNode(tree);
  parent.appendChild(element);

  return element;
}
