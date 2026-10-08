
import * as kg from './kg/core/graph/core'

(function() {
  window.kg = kg
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = kg
  }
})()


