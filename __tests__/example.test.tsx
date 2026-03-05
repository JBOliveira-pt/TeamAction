import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple example test
describe('Example Test', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true)
  })

  it('should render a simple component', () => {
    const TestComponent = () => <div>Hello Test</div>
    render(<TestComponent />)
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  })
})
