import {
  CalendarDotsIcon,
  CheckCircleIcon,
  ListBulletsIcon,
} from '@phosphor-icons/react'

import SegmentedControl, {
  type Option,
} from '@/components/common/SegmentedControl'

export type View = 'work' | 'week' | 'completed'

export type ViewSwitcherProps = {
  activeView: View
  onViewChange: (view: View) => void
}

const VIEWS: Option<View>[] = [
  { value: 'work', label: 'Work', icon: ListBulletsIcon },
  { value: 'week', label: 'Week', icon: CalendarDotsIcon },
  { value: 'completed', label: 'Completed', icon: CheckCircleIcon },
]

export default function ViewSwitcher({
  activeView,
  onViewChange,
}: ViewSwitcherProps) {
  return (
    <SegmentedControl
      options={VIEWS}
      value={activeView}
      onChange={onViewChange}
      size="sm"
    />
  )
}
