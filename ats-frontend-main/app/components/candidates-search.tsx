"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Slider } from "../../components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Download, Search, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, FileText, Clock, Database, CheckCircle, AlertCircle, Eye } from "lucide-react"
import { toast } from "../../hooks/use-toast"

interface SearchResult {
  resume_id: number
  candidate_name: string
  candidate_email: string
  filename: string
  similarity_score: number
  similarity_percentage: number
  parsed_data: {
    Name: string
    Email: string
    Phone?: string
    Skills?: string[]
    Address?: string
    Summary?: string
    Projects?: Array<{
      Name: string
      Description?: string
      Technologies?: string[]
    }>
    Education?: Array<{
      Year: string
      Field: string
      Degree: string
      Institution: string
    }>
    Languages?: string[]
    Experience?: Array<{
      Company: string
      Duration: string
      Position: string
      Description: string
    }>
    Certifications?: string[]
    TotalExperience: string
  }
}

interface EmbeddingStatus {
  total_resumes: number
  embedded_resumes: number
  pending_resumes: number
  embedding_percentage: number
  last_updated: string
}

export default function CandidatesSearch() {
  const [activeTab, setActiveTab] = useState("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [similarityThreshold, setSimilarityThreshold] = useState([30])
  const [maxResults, setMaxResults] = useState([10])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<SearchResult | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch embedding status on component mount
  useEffect(() => {
    if (activeTab === "status") {
      fetchEmbeddingStatus()
    }
  }, [activeTab])

  const fetchEmbeddingStatus = async () => {
    try {
      setIsLoadingStatus(true)
      
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        toast({
          title: "Error",
          description: "Authentication required. Please login again.",
          variant: "destructive",
        })
        return;
      }

      const response = await fetch("http://147.93.155.233:8002/api/v1/ai-search/embedding-status", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyId.toString()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEmbeddingStatus(data)
      } else {
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          return;
        } else if (response.status === 403) {
          toast({
            title: "Error",
            description: "Access denied. You do not have permission to view embedding status.",
            variant: "destructive",
          })
          return;
        }
        
        toast({
          title: "Error",
          description: "Failed to fetch embedding status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to embedding status API",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStatus(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSearching(true)
      
      // Get JWT token and company ID from localStorage
      const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
      const token = user?.token;
      const companyId = user?.companyId;

      if (!token || !companyId) {
        toast({
          title: "Error",
          description: "Authentication required. Please login again.",
          variant: "destructive",
        })
        return;
      }

      const response = await fetch("http://147.93.155.233:8002/api/v1/ai-search/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyId.toString()
        },
        body: JSON.stringify({
          query: searchQuery,
          similarity_threshold: similarityThreshold[0] / 100,
          max_results: maxResults[0],
          company_id: companyId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        toast({
          title: "Success",
          description: `Found ${data.results?.length || 0} candidates`,
        })
      } else {
        // Handle authentication errors
        if (response.status === 401) {
          localStorage.removeItem("authenticated");
          localStorage.removeItem("auth_email");
          localStorage.removeItem("ats_user");
          window.location.href = '/login';
          return;
        } else if (response.status === 403) {
          toast({
            title: "Error",
            description: "Access denied. You do not have permission to search candidates.",
            variant: "destructive",
          })
          return;
        }
        
        toast({
          title: "Error",
          description: "Failed to perform search",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to search API",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const downloadCandidateResult = (candidate: SearchResult) => {
    const dataStr = JSON.stringify(candidate, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${candidate.candidate_name.replace(/\s+/g, "_")}_search_result.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: `Downloaded results for ${candidate.candidate_name}`,
    })
  }

  const downloadAllResults = () => {
    if (searchResults.length === 0) {
      toast({
        title: "No Results",
        description: "No search results to download",
        variant: "destructive",
      })
      return
    }

    const dataStr = JSON.stringify(searchResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `candidate_search_results_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: `Downloaded all ${searchResults.length} search results`,
    })
  }

  const openCandidateDialog = (candidate: SearchResult) => {
    setSelectedCandidate(candidate)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates Search</h1>
          <p className="text-muted-foreground">
            AI-powered candidate search using semantic embeddings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Embedding</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Parameters</CardTitle>
              <CardDescription>
                Configure your search criteria and similarity thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search-query">Search Query</Label>
                <div className="flex space-x-2">
                  <Input
                    id="search-query"
                    placeholder="Enter job title, skills, or requirements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="w-4 h-4 mr-2" />
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Similarity Threshold: {similarityThreshold[0]}%</Label>
                  <Slider
                    value={similarityThreshold}
                    onValueChange={setSimilarityThreshold}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum similarity score required for results
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Results: {maxResults[0]}</Label>
                  <Slider
                    value={maxResults}
                    onValueChange={setMaxResults}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of results to return
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Search Results</CardTitle>
                    <CardDescription>
                      Found {searchResults.length} candidates matching your criteria
                    </CardDescription>
                  </div>
                  <Button onClick={downloadAllResults} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {searchResults.map((candidate, index) => (
                      <Card key={candidate.resume_id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{candidate.candidate_name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  {candidate.parsed_data.Email && (
                                    <div className="flex items-center space-x-1">
                                      <Mail className="w-3 h-3" />
                                      <span>{candidate.parsed_data.Email}</span>
                                    </div>
                                  )}
                                  {candidate.parsed_data.Phone && (
                                    <div className="flex items-center space-x-1">
                                      <Phone className="w-3 h-3" />
                                      <span>{candidate.parsed_data.Phone}</span>
                                    </div>
                                  )}
                                  {candidate.parsed_data.Address && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{candidate.parsed_data.Address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <Badge variant="secondary" className="text-sm">
                                Score: {candidate.similarity_percentage.toFixed(1)}%
                              </Badge>
                              {candidate.parsed_data.TotalExperience && candidate.parsed_data.TotalExperience !== "0 months" && (
                                <Badge variant="outline" className="text-sm">
                                  {candidate.parsed_data.TotalExperience}
                                </Badge>
                              )}
                            </div>

                            {candidate.parsed_data.Summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {candidate.parsed_data.Summary}
                              </p>
                            )}

                            {candidate.parsed_data.Skills && candidate.parsed_data.Skills.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {candidate.parsed_data.Skills.slice(0, 5).map((skill, skillIndex) => (
                                  <Badge key={skillIndex} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.parsed_data.Skills.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{candidate.parsed_data.Skills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              onClick={() => openCandidateDialog(candidate)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              onClick={() => downloadCandidateResult(candidate)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Status</CardTitle>
              <CardDescription>
                Current status of resume embeddings in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStatus ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : embeddingStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{embeddingStatus.total_resumes}</div>
                    <div className="text-sm text-blue-600">Total Resumes</div>
                    <Database className="w-6 h-6 mx-auto mt-2 text-blue-400" />
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{embeddingStatus.embedded_resumes}</div>
                    <div className="text-sm text-green-600">Embedded</div>
                    <CheckCircle className="w-6 h-6 mx-auto mt-2 text-green-400" />
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{embeddingStatus.pending_resumes}</div>
                    <div className="text-sm text-yellow-600">Pending</div>
                    <AlertCircle className="w-6 h-6 mx-auto mt-2 text-yellow-400" />
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{embeddingStatus.embedding_percentage}%</div>
                    <div className="text-sm text-purple-600">Completion</div>
                    <Clock className="w-6 h-6 mx-auto mt-2 text-purple-400" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load embedding status
                </div>
              )}

              {embeddingStatus && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(embeddingStatus.last_updated).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Candidate Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCandidate.candidate_name}</h2>
                    <p className="text-muted-foreground">{selectedCandidate.candidate_email}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Similarity Score: {selectedCandidate.similarity_percentage.toFixed(1)}% | 
                  Resume ID: {selectedCandidate.resume_id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCandidate.parsed_data.Phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{selectedCandidate.parsed_data.Phone}</span>
                      </div>
                    )}
                    {selectedCandidate.parsed_data.Address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Address:</span>
                        <span>{selectedCandidate.parsed_data.Address}</span>
                      </div>
                    )}
                    {selectedCandidate.parsed_data.TotalExperience && selectedCandidate.parsed_data.TotalExperience !== "0 months" && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Experience:</span>
                        <span>{selectedCandidate.parsed_data.TotalExperience}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary */}
                {selectedCandidate.parsed_data.Summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedCandidate.parsed_data.Summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Skills */}
                {selectedCandidate.parsed_data.Skills && selectedCandidate.parsed_data.Skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.parsed_data.Skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Experience */}
                {selectedCandidate.parsed_data.Experience && selectedCandidate.parsed_data.Experience.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5" />
                        <span>Work Experience</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCandidate.parsed_data.Experience.map((exp, index) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-lg">{exp.Position}</h4>
                              <Badge variant="outline">{exp.Duration}</Badge>
                            </div>
                            <p className="font-medium text-blue-600 mb-2">{exp.Company}</p>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {exp.Description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {selectedCandidate.parsed_data.Education && selectedCandidate.parsed_data.Education.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5" />
                        <span>Education</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCandidate.parsed_data.Education.map((edu, index) => (
                          <div key={index} className="border-l-4 border-green-200 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-lg">{edu.Degree}</h4>
                              <Badge variant="outline">{edu.Year}</Badge>
                            </div>
                            <p className="font-medium text-green-600 mb-1">{edu.Field}</p>
                            <p className="text-muted-foreground">{edu.Institution}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Projects */}
                {selectedCandidate.parsed_data.Projects && selectedCandidate.parsed_data.Projects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Projects</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCandidate.parsed_data.Projects.map((project, index) => (
                          <div key={index} className="border-l-4 border-purple-200 pl-4">
                            <h4 className="font-semibold text-lg mb-2">{project.Name}</h4>
                            {project.Description && (
                              <p className="text-muted-foreground mb-2">{project.Description}</p>
                            )}
                            {project.Technologies && project.Technologies.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {project.Technologies.map((tech, techIndex) => (
                                  <Badge key={techIndex} variant="outline" className="text-xs">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {selectedCandidate.parsed_data.Certifications && selectedCandidate.parsed_data.Certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="w-5 h-5" />
                        <span>Certifications</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.parsed_data.Certifications.map((cert, index) => (
                          <Badge key={index} variant="secondary">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {selectedCandidate.parsed_data.Languages && selectedCandidate.parsed_data.Languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.parsed_data.Languages.map((language, index) => (
                          <Badge key={index} variant="outline">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    onClick={() => downloadCandidateResult(selectedCandidate)}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Data
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
