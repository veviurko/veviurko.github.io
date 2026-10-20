import copy, unittest
from update_publications import merge
class PublicationMergeTests(unittest.TestCase):
 def setUp(self):
  self.old={'publications':[{'id':'paper-a','title':'A title','authors':['Grigorii Veviurko'],'year':2024,'venue':'ICML 2024','links':{'Paper':'https://example.com/paper','Code':'https://example.com/code'},'type':'Conference','selected':True}]}
  self.incoming=[{'bib':{'title':'A TITLE!','author':'Grigorii Veviurko and Co Author','pub_year':'2023','journal':'arXiv'},'pub_url':'https://example.com/preprint'}]
 def test_overrides_and_links_survive(self):
  result=merge(self.old,self.incoming,{'overrides':{'A title':{'year':2024,'venue':'ICML 2024'}}})['publications'][0]
  self.assertEqual(result['year'],2024);self.assertEqual(result['venue'],'ICML 2024');self.assertTrue(result['selected']);self.assertIn('Code',result['links'])
 def test_partial_results_do_not_remove_papers(self):
  incoming=[{'bib':{'title':'Another paper','author':'Grigorii Veviurko','pub_year':'2026'},'pub_url':'https://example.com/new'}]
  result=merge(self.old,incoming,{})['publications'];self.assertEqual(len(result),2);self.assertFalse(result[0]['selected'])
 def test_duplicates_collapsed(self):
  self.assertEqual(len(merge(self.old,self.incoming*2,{})['publications']),1)
 def test_failure_is_non_mutating(self):
  before=copy.deepcopy(self.old)
  with self.assertRaises(ValueError):merge(self.old,[],{})
  with self.assertRaises(ValueError):merge(self.old,[{'bib':{'title':'Bad'}}],{})
  self.assertEqual(before,self.old)
 def test_exclusion(self):
  self.assertEqual(merge(self.old,self.incoming,{'exclude':['A title']})['publications'],[])
if __name__=='__main__':unittest.main()
