"use client"

import { useParams, useRouter } from "next/navigation"
import {
  Button,
  Card,
  Alert,
  AlertDescription,
  SidebarTrigger,
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui"

export default function NextStepPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Draft Created</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Product Draft Created!
              </h1>
              <p className="text-muted-foreground">Product ID: {productId}</p>
            </div>

            <Alert className="mb-6">
              <AlertDescription>
                <p className="font-medium mb-1">Next Step Placeholder</p>
                <p className="text-muted-foreground">
                  This is where you would continue setting up your product (title, price,
                  category, etc.)
                </p>
              </AlertDescription>
            </Alert>

            <Button onClick={() => router.push("/products")}>Back to Products</Button>
          </Card>
        </div>
      </div>
    </>
  )
}
