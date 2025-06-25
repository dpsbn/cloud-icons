import { Header } from "@/components/layout/header"
import { IconGrid } from "@/components/layout/icon-grid"

export default function Home() {
  return (
    <main>
      <Header />

      <section className='container mx-auto px-4 py-8'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
            All the latest Azure icons in SVG and PNG format
          </h2>
          <p className='text-gray-600 dark:text-gray-300'>
            Download, copy and paste Azure icons in SVG and PNG format for your
            projects.
          </p>
          <p className='text-sm text-gray-500 mt-4'>683 icons found</p>
        </div>

        <IconGrid />
      </section>
    </main>
  )
}
