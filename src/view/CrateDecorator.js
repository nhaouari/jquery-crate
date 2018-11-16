/**This class is to add functions for the main class when display is true */
export class CrateDecorator {
  /**
   * add ctrl+left arrow and ctrl+right arrow shortcuts for the editor
   * @param crate  crate instance
   */
  static addMoveShortcuts(crate) {
    // custom prev next page event
    if (!crate.addMoveShortcuts) {
      crate.addMoveShortcuts = function() {
        let codes = {
          37: 'prev',
          39: 'next'
        }

        document.addEventListener && // Modern browsers only
          document.addEventListener(
            'keydown',
            function(e) {
              const code = codes[e.keyCode]
              if ((e.ctrlKey || e.metaKey) && code) {
                const evt = document.createEvent('Event')
                evt.initEvent(code, true, false)
                e.target.dispatchEvent(evt) // dispatch on current target. Event will bubble up to window
                e.preventDefault() // opera defaut fix
              }
            },
            false
          )

        $(document).on('next', () => {
          console.log('nnnnnext')
          this.moveToNext()
        })

        $(document).on('prev', () => {
          console.log('pppppprev')
          this.moveToPrevious()
        })
      }
      crate.addMoveShortcuts()
    }
  }

  /**
   * add the resize event to focus always on the specific editor
   * @param {*} crate
   */
  static addResize(crate) {
    if (!crate.Resize) {
      crate.resize = function() {
        this.resizeTimeout
        $(window).resize(() => {
          clearTimeout(this.resizeTimeout)
          this.resizeTimeout = setTimeout(() => {
            this.focusInToDocument(this.actualSessionIndex)
            clearTimeout(this.resizeTimeout)
            console.log('resiiize')
          }, 200)
        })
      }
      crate.resize()
    }
  }
}
