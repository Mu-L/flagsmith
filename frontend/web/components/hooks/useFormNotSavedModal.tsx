import { useState, useEffect, useRef, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import Button from 'components/base/forms/Button'

/**
 * useFormNotSavedModal
 * @param {history: RouterChildContext['router']['history']} history - The history object
 * @param {string} warningMessage - The message to show when user attempts to leave
 * @returns {[React.FC, Function, boolean]}
 */

type UseFormNotSavedModalReturn = [
  React.FC,
  React.Dispatch<React.SetStateAction<boolean>>,
  boolean,
]

interface UseFormNotSavedModalOptions {
  warningMessage?: string
  onDiscard?: () => void
}

const useFormNotSavedModal = (
  options: UseFormNotSavedModalOptions = {},
): UseFormNotSavedModalReturn => {
  const {
    onDiscard,
    warningMessage = 'You have unsaved changes, are you sure you want to leave?',
  } = options

  const [isDirty, setIsDirty] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [nextLocation, setNextLocation] = useState<Location | null>(null)

  const history = useHistory()

  const unblockRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (!isDirty) return

    const unblock = history.block((transition: Location) => {
      setNextLocation(transition)
      setIsNavigating(true)
      return false
    })

    unblockRef.current = unblock
    return () => {
      if (unblockRef.current) {
        unblockRef.current()
      }
      unblockRef.current = null
    }
  }, [isDirty, history])

  const discardAndConfirmNavigation = useCallback(() => {
    // allow the route change to happen
    if (unblockRef.current) {
      unblockRef.current() // unblocks
      unblockRef.current = null
    }
    // navigate
    if (nextLocation) {
      history.push(`${nextLocation.pathname}${nextLocation.search}`)
    }
    if (onDiscard) {
      onDiscard()
    }
    setIsDirty(false)
    setIsNavigating(false)
    setNextLocation(null)
  }, [nextLocation, history, onDiscard])

  const cancelNavigation = useCallback(() => {
    history.push(`${history.location.pathname}${history.location.search}`)
    setIsNavigating(false)
    setNextLocation(null)
  }, [history])

  // Listen for browser/tab close (the 'beforeunload' event)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = warningMessage
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, warningMessage])

  const DirtyFormModal = () => (
    <Modal isOpen={isDirty && isNavigating} toggle={cancelNavigation}>
      <ModalHeader>Unsaved Changes</ModalHeader>
      <ModalBody>{warningMessage}</ModalBody>
      <div className='modal-footer'>
        <Button theme='secondary' className='mr-2' onClick={cancelNavigation}>
          Cancel
        </Button>
        <Button theme='danger' onClick={discardAndConfirmNavigation}>
          Yes, discard changes
        </Button>
      </div>
    </Modal>
  )

  return [DirtyFormModal, setIsDirty, isDirty]
}

export default useFormNotSavedModal
