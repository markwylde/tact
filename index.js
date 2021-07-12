import t, { render, useState, useEffect } from './tact.js';

function MyCounter () {
  const [count, setCount] = useState(0);
  const [auto, setAuto] = useState(false);

  // useEffect(() => {
  //   document.title = count + ' counts';
  // });

  useEffect(() => {
    if (!auto) {
      return;
    }

    const timer = setInterval(() => {
      setCount(count => count + 1);
    }, 500);
    return () => {
      clearInterval(timer);
    };
  }, [auto]);

  return (
    t('div', {},
      t('span', {}, 'The count is: ', count),
      t('button', {
        onclick: () => {
          setCount(count => count - 1);
        }
      }, 'decrease'),
      t('button', {
        onclick: () => {
          setCount(count => count + 1);
        }
      }, 'increase'),
      t('button', {
        onclick: () => {
          setAuto(!auto);
        }
      },
      auto ? 'stop' : 'start'
      )
    )
  );
}

function MyContainer () {
  return (
    t('div', {},
      t('h1', {}, 'This is my container'),
      t(MyCounter)
    )
  );
}

document.addEventListener('DOMContentLoaded', function () {
  const ui = t(MyContainer);

  render(ui, document.body);
});
