import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/profile/$username/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      params,
      to: '/profile/$username/assets',
    })
  },
  component: RouteComponent,
})

function RouteComponent() {
  return null
}
