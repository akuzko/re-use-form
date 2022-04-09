import jsdom from 'jsdom';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

const { JSDOM } = jsdom;

Enzyme.configure({ adapter: new Adapter() });

const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = function(fn) {
  setTimeout(fn, 0);
};
