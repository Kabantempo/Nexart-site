'use client'

import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { GridCard } from './grid-card'

type NavItemType = {
  title: string
  href: string
  description?: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
}

function NavigationMenu({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root
      style={{
        display: 'flex',
        maxWidth: 'max-content',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      style={{
        display: 'flex',
        flex: 1,
        listStyle: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: 0,
        margin: 0,
      }}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      style={{ position: 'relative' }}
      {...props}
    />
  )
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      style={{
        display: 'inline-flex',
        width: 'max-content',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        padding: '8px 16px',
        fontSize: '16px',
        fontWeight: 500,
        backgroundColor: 'transparent',
        color: '#888888',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 300ms ease',
        outline: 'none',
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.color = '#6366F1'
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.color = '#888888'
      }}
      {...props}
    >
      {children}
      <ChevronDown
        size={16}
        style={{
          marginLeft: '4px',
          transition: 'transform 300ms ease',
        }}
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '12px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        padding: '16px',
        zIndex: 1000,
        minWidth: '600px',
      }}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50 }}>
      <NavigationMenuPrimitive.Viewport
        style={{
          position: 'relative',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          marginTop: '12px',
        }}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      style={{
        outline: 'none',
        cursor: 'pointer',
      }}
      {...props}
    />
  )
}

function NavGridCard({
  link,
  onMouseEnter,
  onMouseLeave,
  ...props
}: React.ComponentProps<'div'> & {
  link: NavItemType
}) {
  return (
    <NavigationMenuPrimitive.Link asChild>
      <a
        href={link.href}
        style={{
          textDecoration: 'none',
          display: 'block',
        }}
      >
        <GridCard
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderColor: '#E5E7EB',
          }}
          onMouseEnter={(e: any) => {
            e.currentTarget.style.borderColor = '#6366F1'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
          }}
          onMouseLeave={(e: any) => {
            e.currentTarget.style.borderColor = '#E5E7EB'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        >
          {link.icon && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <link.icon size={18} color="#6366F1" />
            </div>
          )}
          <div>
            <p
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                margin: 0,
              }}
            >
              {link.title}
            </p>
            {link.description && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#888888',
                  margin: '4px 0 0 0',
                }}
              >
                {link.description}
              </p>
            )}
          </div>
        </GridCard>
      </a>
    </NavigationMenuPrimitive.Link>
  )
}

function NavSmallItem({
  item,
  ...props
}: React.ComponentProps<'a'> & {
  item: Omit<NavItemType, 'description'>
}) {
  return (
    <a
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 12px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: '#888888',
        fontSize: '14px',
        transition: 'all 300ms ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#6366F1'
        e.currentTarget.style.backgroundColor = '#F5F5F7'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#888888'
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      {...props}
    >
      {item.icon && <item.icon size={20} color="currentColor" />}
      <p style={{ margin: 0 }}>{item.title}</p>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          width: '16px',
        }}
      >
        <ArrowRight
          size={16}
          style={{
            transition: 'all 300ms ease',
            transform: 'translateX(-8px)',
            opacity: 0,
          }}
        />
      </div>
    </a>
  )
}

function NavLargeItem({
  link,
  ...props
}: React.ComponentProps<'a'> & {
  link: NavItemType
}) {
  return (
    <a
      style={{
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: 0,
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'all 300ms ease',
      }}
      onMouseEnter={(e) => {
        e.style.borderColor = '#6366F1'
        e.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.style.borderColor = '#E5E7EB'
        e.style.boxShadow = 'none'
      }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
            {link.title}
          </span>
          {link.description && (
            <p style={{ fontSize: '12px', color: '#888888', margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {link.description}
            </p>
          )}
        </div>
        {link.icon && <link.icon size={24} color="#888888" />}
      </div>
    </a>
  )
}

function NavItemMobile({
  item,
  ...props
}: React.ComponentProps<'a'> & {
  item: NavItemType
}) {
  return (
    <a
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 300ms ease',
        outline: 'none',
        textDecoration: 'none',
        color: '#1A1A1A',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.style.backgroundColor = '#F5F5F7'
        e.style.color = '#6366F1'
      }}
      onMouseLeave={(e) => {
        e.style.backgroundColor = 'transparent'
        e.style.color = '#1A1A1A'
      }}
      {...props}
    >
      <div
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          width: '40px',
          height: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          flexShrink: 0,
        }}
      >
        {item.icon && <item.icon size={20} color="#6366F1" />}
      </div>
      <div style={{ display: 'flex', height: '40px', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
          {item.title}
        </p>
        <span style={{ fontSize: '12px', color: '#888888', margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.description}
        </span>
      </div>
    </a>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavGridCard,
  NavSmallItem,
  NavLargeItem,
  NavItemMobile,
  type NavItemType,
}
