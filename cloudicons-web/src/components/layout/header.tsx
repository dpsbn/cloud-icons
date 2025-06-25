import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"

export function Header() {
  return (
    <header className='container mx-auto px-4 py-6'>
      <div className='flex flex-col items-center space-y-6'>
        {/* Logo */}
        <div className='flex items-center space-x-2'>
          <Image src='/logo.png' alt='Cloud Icons' width={50} height={50} />
          <h1 className='text-2xl font-bold text-blue-600'>Azure Icons</h1>
        </div>

        {/* Search and Categories */}
        <div className='w-full max-w-3xl flex gap-4'>
          <Input type='search' placeholder='Search icons' className='flex-1' />
          <Select>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              <SelectItem value='ai'>AI & ML</SelectItem>
              <SelectItem value='compute'>Compute</SelectItem>
              <SelectItem value='storage'>Storage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  )
}
