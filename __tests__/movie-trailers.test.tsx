import { render, screen, fireEvent } from "@testing-library/react"
import { MovieTrailers } from "@/components/movie-trailers"

describe("MovieTrailers", () => {
  it("renders without crashing", () => {
    render(<MovieTrailers />)
    expect(screen.getByText("Let Him Cook")).toBeInTheDocument()
  })

  it("changes active trailer when clicking on a thumbnail", () => {
    render(<MovieTrailers />)
    const neonNightsThumbnail = screen.getByText("Neon Nights")
    fireEvent.click(neonNightsThumbnail)
    expect(screen.getByText("Neon Nights")).toHaveClass("text-2xl")
  })

  it("toggles mute when clicking the mute button", () => {
    render(<MovieTrailers />)
    const muteButton = screen.getByRole("button", { name: /toggle mute/i })
    fireEvent.click(muteButton)
    expect(screen.getByLabelText(/unmute/i)).toBeInTheDocument()
  })
})

